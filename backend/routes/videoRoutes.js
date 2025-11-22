const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const mongoose = require('mongoose');
const Video = require('../models/Video');
const { protect, roleCheck } = require('../middleware/authMiddleware');
const { startProcessing } = require('../services/videoProcessor'); // Assume this file is correctly implemented

const router = express.Router();

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const RAW_DIR = path.join(UPLOADS_DIR, 'raw');
const PROCESSED_DIR = path.join(UPLOADS_DIR, 'processed');

// Ensure upload directories exist
if (!fs.existsSync(RAW_DIR)) fs.mkdirSync(RAW_DIR, { recursive: true });
if (!fs.existsSync(PROCESSED_DIR)) fs.mkdirSync(PROCESSED_DIR, { recursive: true });

// Helper to safely delete file
const safeUnlink = (p) => { try { if (p && fs.existsSync(p)) fs.unlinkSync(p); } catch (e) { console.warn('unlink failed', e); } };

// ----------------------------------------------------------------------
// Multer Configuration
// ----------------------------------------------------------------------

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, RAW_DIR),
  filename: (req, file, cb) => {
    // Defensively use placeholder if auth failed (though upload will ultimately fail metadata save)
    const userId = req.userId || 'unknown-user'; 
    const extname = path.extname(file.originalname) || '';
    cb(null, `${userId}-${Date.now()}${extname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 1024 }, // 1GB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /mp4|mov|avi|wmv|flv|mkv/;
    const mimetype = filetypes.test(String(file.mimetype));
    const extname = filetypes.test(path.extname(file.originalname || '').toLowerCase());
    if (mimetype && extname) return cb(null, true);
    return cb(new Error('Only MP4, MOV, and common video files are allowed.'), false); 
  },
});

// ----------------------------------------------------------------------
// POST /api/videos/upload (RBAC: Editor/Admin only)
// ----------------------------------------------------------------------
router.post(
  '/upload',
  protect,
  roleCheck(['editor','admin']),
  // Execute Multer directly in the middleware chain to ensure proper flow control
  (req, res, next) => {
    upload.single('video')(req, res, (err) => {
      // Custom error handling for Multer errors
      if (err) {
        console.error('Multer upload failed:', err && (err.stack || err));
        if (err instanceof multer.MulterError) {
          return res.status(400).json({ message: 'Upload error: ' + err.code, error: err.message });
        }
        return res.status(400).json({ message: 'Upload failed', error: err.message || 'File processing error.' });
      }
      next(); // Continue to the final handler
    });
  },

  async (req, res) => { // Final handler for metadata save and processing start
    const { title, description } = req.body;
    const { userId } = req; 

    if (!req.file) return res.status(400).json({ message: 'No video file provided.' });

    // 1. Validation checks (Critical for Mongoose Schema)
    if (!title || title.trim().length === 0) {
      safeUnlink(req.file.path);
      return res.status(400).json({ message: 'Title is required for video metadata.' });
    }
    if (!userId) { // Should be caught by protect/roleCheck but checked defensively
      safeUnlink(req.file.path);
      return res.status(401).json({ message: 'Authorization required: User ID missing.' });
    }
    
    // 2. Data sanitation
    const trimmedTitle = title.trim();
    const trimmedDescription = description ? String(description).trim() : '';

    try {
      // 3. Create document in MongoDB
      const video = await Video.create({
        user: userId, 
        title: trimmedTitle,
        description: trimmedDescription,
        filePath: req.file.path,
        fileSize: req.file.size,
        status: 'pending',
        sensitivity: 'unchecked'
      });

      // 4. Start background processing (non-blocking)
      try { 
        const io = req.app.get('socketio'); 
        if (startProcessing) startProcessing(video._id, io); 
      } catch (e) { 
        console.warn('startProcessing failed (Check services/videoProcessor.js)', e && e.message); 
      }

      return res.status(201).json({ message: 'Video uploaded successfully, processing started.', video });
    } catch (error) {
      // 5. Error Cleanup and Logging
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
// GET /api/videos (LISTING)
// ----------------------------------------------------------------------
router.get('/', protect, async (req, res) => {
  try {
    const { sensitivity, sort } = req.query;
    const filter = { user: req.userId }; // Multi-Tenancy Enforcement
    if (sensitivity && ['safe','flagged','unchecked'].includes(sensitivity)) filter.sensitivity = sensitivity;
    const sortOptions = sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };
    const videos = await Video.find(filter).sort(sortOptions);
    res.json(videos);
  } catch (err) {
    console.error('Fetch videos failed:', err && (err.stack || err));
    res.status(500).json({ message: 'Failed to fetch videos.' });
  }
});


// ----------------------------------------------------------------------
// GET /api/videos/stream/:videoId (STREAMING)
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

    // Multi-Tenancy Check
    if (String(video.user) !== String(req.userId)) {
      return res.status(403).send('Forbidden: You do not own this video.');
    }
    
    // Quality selection logic (checks processedQualities array)
    let qualityData = video.processedQualities.find(q => q.quality === requestedQuality);
    
    if (!qualityData || !fs.existsSync(qualityData.path)) {
        const highestAvailable = video.processedQualities.reduce((prev, current) => 
            (prev && prev.bitrate > current.bitrate) ? prev : current, null
        );
        
        if (highestAvailable && fs.existsSync(highestAvailable.path)) {
            qualityData = highestAvailable;
        } else {
            return res.status(404).send(`Video file for quality ${requestedQuality} not found.`);
        }
    }
    
    const videoPath = qualityData.path;
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
      'Content-Type': 'video/mp4',
    };

    res.writeHead(206, headers); // 206 Partial Content

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
// DELETE /api/videos/:videoId (RBAC: Editor/Admin only)
// ----------------------------------------------------------------------
router.delete('/:videoId', protect, roleCheck(['editor', 'admin']), async (req, res) => {
    const videoId = req.params.videoId;
    try {
        const video = await Video.findById(videoId);

        if (!video) {
            return res.status(404).json({ message: 'Video not found' });
        }

        // Multi-Tenancy Check
        if (String(video.user) !== String(req.userId)) {
            return res.status(403).json({ message: 'Not authorized to delete this video.' });
        }

        // Delete raw file
        safeUnlink(video.filePath);
        
        // Delete all processed quality files
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