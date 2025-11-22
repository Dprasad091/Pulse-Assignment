const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const Video = require('../models/Video');

// Define the directory for processed, streamable videos
const PROCESSED_DIR = path.join(__dirname, '..', 'uploads', 'processed');
if (!fs.existsSync(PROCESSED_DIR)) {
  fs.mkdirSync(PROCESSED_DIR);
}

/**
 * Simulates content sensitivity analysis.
 * In a real app, this would be an API call to a service like AWS Rekognition, Azure Content Moderator, etc.
 */
const runSensitivityAnalysis = async (videoPath) => {
  // Simulate a 5-second delay for analysis
  await new Promise(resolve => setTimeout(resolve, 5000)); 

  // 10% chance of flagging a video as 'flagged' for testing purposes
  const isFlagged = Math.random() < 0.1; 
  return isFlagged ? 'flagged' : 'safe';
};

/**
 * Main function to process video: compression, streaming prep, and analysis.
 */
const startProcessing = async (videoId, io) => {
  const video = await Video.findById(videoId);
  if (!video) return;

  const originalFilePath = video.filePath;
  const fileExtension = path.extname(originalFilePath);
  // Example: userId-timestamp.mp4 -> processed-userId-timestamp.mp4
  const processedFileName = `processed-${path.basename(originalFilePath, fileExtension)}.mp4`;
  const outputFilePath = path.join(PROCESSED_DIR, processedFileName);

  // 1. Update status to 'processing'
  video.status = 'processing';
  await video.save();

  // 2. FFmpeg Command Setup (Optimization for Streaming)
  ffmpeg.ffprobe(originalFilePath, async (err, metadata) => {
    if (err) {
      console.error('FFprobe error:', err);
      video.status = 'failed';
      await video.save();
      io.to(String(video.user)).emit('videoStatus', { id: video._id, status: 'failed' });
      return;
    }
    
    // Update video duration metadata
    video.duration = metadata.format.duration;
    await video.save();

    // The FFmpeg process
    const ffmpegJob = ffmpeg(originalFilePath)
      // Set video codec, bitrate, and format for broad streaming compatibility (H.264/AAC in MP4)
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions([
        '-movflags frag_keyframe+empty_moov', // Crucial for HTTP streaming (Fast Start)
        '-preset veryfast', // Fastest encoding speed for quick testing
        '-crf 23' // Quality setting
      ])
      .on('end', async (stdout, stderr) => {
        console.log('FFmpeg finished processing:', video.title);
        
        // 3. Run Sensitivity Analysis after initial processing
        const sensitivityResult = await runSensitivityAnalysis(outputFilePath);
        
        // 4. Update final status and paths
        video.processedPath = outputFilePath;
        video.sensitivity = sensitivityResult;
        video.status = 'safe'; // Assume 'safe' unless flagged
        video.processingProgress = 100;

        if (sensitivityResult === 'flagged') {
            video.status = 'flagged';
        }

        await video.save();
        
        // 5. Notify the user (tenant) in real-time
        // We emit to a specific room/user ID for multi-tenant isolation
        io.to(String(video.user)).emit('videoStatus', { 
            id: video._id, 
            status: video.status, 
            sensitivity: video.sensitivity,
            progress: 100,
            processedPath: video.processedPath
        });

      })
      .on('progress', (progress) => {
        // Send real-time progress update (e.g., every 5% increase)
        const currentProgress = Math.floor(progress.percent);
        if (currentProgress > video.processingProgress) {
            // Update DB only for significant progress change
            video.processingProgress = currentProgress;
            video.save(); 
            
            // Notify the user in real-time
            io.to(String(video.user)).emit('videoProgress', { 
                id: video._id, 
                progress: currentProgress 
            });
        }
      })
      .on('error', async (err, stdout, stderr) => {
        console.error('FFmpeg error:', err.message);
        video.status = 'failed';
        await video.save();
        io.to(String(video.user)).emit('videoStatus', { id: video._id, status: 'failed' });
        // Clean up partially processed file if needed
        fs.unlink(outputFilePath, () => {});
      })
      .save(outputFilePath);
  });
};

module.exports = { startProcessing };