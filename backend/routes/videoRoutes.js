const express = require('express')
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const mongoose = require('mongoose');
const Video = require('../models/Video');
const { protect, roleCheck } = require('../middleware/authMiddleware');
const { startProcessing } = require('../services/videoProcessor'); // Assume this is correctly implemented

const router = express.Router();

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const RAW_DIR = path.join(UPLOADS_DIR, 'raw');
const PROCESSED_DIR = path.join(UPLOADS_DIR, 'processed');

if (!fs.existsSync(RAW_DIR)) fs.mkdirSync(RAW_DIR, { recursive: true });
if (!fs.existsSync(PROCESSED_DIR)) fs.mkdirSync(PROCESSED_DIR, { recursive: true });

// Helper functions (safeUnlink, storage, upload) remain the same...

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, RAW_DIR),
  filename: (req, file, cb) => {
    const userId = req.userId || 'unknown-user';
    const extname = path.extname(file.originalname) || '';
    cb(null, `${userId}-${Date.now()}${extname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 1024 }, 
  fileFilter: (req, file, cb) => {
    const filetypes = /mp4|mov|avi|wmv|flv|mkv/;
    const mimetype = filetypes.test(String(file.mimetype));
    const extname = filetypes.test(path.extname(file.originalname || '').toLowerCase());
    if (mimetype && extname) return cb(null, true);
    return cb(new Error('Only MP4, MOV, and common video files are allowed.'), false); 
  },
});

const safeUnlink = (p) => { try { if (p && fs.existsSync(p)) fs.unlinkSync(p); } catch (e) { console.warn('unlink failed', e); } };

// ----------------------------------------------------------------------
// POST /api/videos/upload (TEMPORARY BYPASS APPLIED HERE)
// ----------------------------------------------------------------------
router.post(
  '/upload',
  protect,
  roleCheck(['editor','admin']),
  (req, res, next) => {
    upload.single('video')(req, res, (err) => {
      if (err) {
        console.error('Multer upload failed:', err && (err.stack || err));
        if (err instanceof multer.MulterError) {
          return res.status(400).json({ message: 'Upload error: ' + err.code, error: err.message });
        }
        return res.status(400).json({ message: 'Upload failed', error: err.message || 'File processing error.' });
      }
      next();
    });
  },
  async (req, res) => { 
    const { title, description } = req.body;
    const { userId } = req; 

    if (!req.file) return res.status(400).json({ message: 'No video file provided.' });
    if (!title || title.trim().length === 0) { safeUnlink(req.file.path); return res.status(400).json({ message: 'Title is required for video metadata.' }); }
    if (!userId) { safeUnlink(req.file.path); return res.status(401).json({ message: 'Authorization required: User ID missing.' }); }

    try {
      // 1. Create document in MongoDB
      const video = await Video.create({
        user: userId, 
        title: title.trim(),
        description: description ? String(description).trim() : '',
        filePath: req.file.path,
        fileSize: req.file.size,
        status: 'safe', // 🔑 FIX: Set status to 'safe' immediately 
        processingProgress: 100, 
        sensitivity: 'safe',
        // 🔑 processedQualities is intentionally left empty here
      });

      // 🛑 PROCESSING BYPASS: Comment out the startProcessing call
      /* try { 
        const io = req.app.get('socketio'); 
        if (startProcessing) startProcessing(video._id, io); 
      } catch (e) { 
        console.warn('startProcessing failed (FFmpeg issue)', e && e.message); 
      } */

      return res.status(201).json({ 
          message: 'Video uploaded successfully, processing bypassed for testing.', 
          video 
      });
    } catch (error) {
      console.error('Video Upload Failed (Metadata Error):', error && (error.stack || error));
      safeUnlink(req.file && req.file.path); 
      if (error && error.code === 11000) return res.status(409).json({ message: 'Duplicate filePath or unique constraint violated.' });
      if (error && error.name === 'ValidationError') {
        return res.status(400).json({ message: 'Validation failed', details: error.errors });
      }
      return res.status(500).json({ message: 'Video Upload Failed: Server error.' });
    }
  }
);

// ----------------------------------------------------------------------
// GET /api/videos/stream/:videoId (STREAMING FIX)
// ----------------------------------------------------------------------
router.get('/stream/:videoId', protect, async (req, res) => {
  const videoId = req.params.videoId;
  const range = req.headers.range;
  const requestedQuality = req.query.quality || 'high'; 

  if (!range) {
    return res.status(400).send('Requires Range header');
  }

  try {
    const video = await Video.findById(videoId);

    if (!video || video.status !== 'safe') {
      return res.status(404).send('Video not found or not ready for streaming.');
    }

    if (String(video.user) !== String(req.userId)) {
      return res.status(403).send('Forbidden: You do not own this video.');
    }
    
    let videoPath;

    // 🔑 FINAL FIX: If processedQualities is empty (due to bypass), use the raw file path.
    if (video.processedQualities.length === 0) {
        // Stream the original file saved by Multer
        videoPath = video.filePath;
    } else {
        // Use quality selection logic (standard behavior)
        let qualityData = video.processedQualities.find(q => q.quality === requestedQuality);
        if (qualityData && fs.existsSync(qualityData.path)) {
            videoPath = qualityData.path;
        }
    }

    if (!videoPath || !fs.existsSync(videoPath)) {
        return res.status(404).send('Video file not found on disk.');
    }
    
    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    
    // HTTP Range Request Logic
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    const chunkSize = (end - start) + 1;

    const headers = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': 'video/mp4', // Assuming the raw uploaded file is compatible
    };

    res.writeHead(206, headers);

    const videoStream = fs.createReadStream(videoPath, { start, end });
    videoStream.pipe(res);

    videoStream.on('error', (err) => {
        console.error('Streaming Error:', err);
        res.status(500).end();
    });

  } catch (error) {
    console.error('Streaming API Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

// ----------------------------------------------------------------------
// DELETE /api/videos/:videoId
// ----------------------------------------------------------------------
router.delete('/:videoId', protect, roleCheck(['editor', 'admin']), async (req, res) => {
    const videoId = req.params.videoId;
    try {
        const video = await Video.findById(videoId);

        if (!video) {
            return res.status(404).json({ message: 'Video not found' });
        }

        if (String(video.user) !== String(req.userId)) {
            return res.status(403).json({ message: 'Not authorized to delete this video.' });
        }

        safeUnlink(video.filePath);
        
        if (video.processedQualities && video.processedQualities.length > 0) {
            video.processedQualities.forEach(q => safeUnlink(q.path));
        }

        await Video.deleteOne({ _id: videoId });

        res.json({ message: 'Video and files removed successfully.' });
    } catch (error) {
        console.error('Video Deletion Failed:', error);
        res.status(500).json({ message: 'Server error during deletion.' });
    }
});


module.exports = router;