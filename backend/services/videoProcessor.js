const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const Video = require('../models/Video');
const ffmpegPath = require('ffmpeg-static'); // Import the path to the installed binary

// 🔑 SET FFmpeg PATH: This fixes local environment issues
ffmpeg.setFfmpegPath(ffmpegPath); 

// Define the directory for processed, streamable videos
const PROCESSED_DIR = path.join(__dirname, '..', 'uploads', 'processed');
if (!fs.existsSync(PROCESSED_DIR)) {
  fs.mkdirSync(PROCESSED_DIR, { recursive: true });
}

// 🔑 Multi-Quality Configuration (Restored from previous step)
const QUALITY_CONFIGS = [
    { quality: 'high', bitrate: '1500k', scale: '1280:-2' }, // 720p
    { quality: 'medium', bitrate: '800k', scale: '854:-2' }, // 480p
    { quality: 'low', bitrate: '400k', scale: '640:-2' },    // 360p
];

/**
 * Simulates content sensitivity analysis.
 */
const runSensitivityAnalysis = async (videoPath) => {
  await new Promise(resolve => setTimeout(resolve, 5000)); 
  const isFlagged = Math.random() < 0.1; 
  return isFlagged ? 'flagged' : 'safe';
};

/**
 * Executes a single FFmpeg conversion job for one quality level.
 */
const runFFmpegJob = (inputPath, outputFileName, config, progressCallback) => {
    const outputFilePath = path.join(PROCESSED_DIR, outputFileName);
    
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .videoCodec('libx264')
            .audioCodec('aac')
            .outputOptions([
                '-movflags frag_keyframe+empty_moov', // Crucial for HTTP streaming
                '-preset veryfast', 
                '-crf 23', 
                `-b:v ${config.bitrate}`, 
                `-vf scale=${config.scale}` 
            ])
            .on('end', () => {
                console.log(`FFmpeg finished: ${config.quality}`);
                resolve({ 
                    quality: config.quality, 
                    path: outputFilePath,
                    bitrate: parseInt(config.bitrate.replace('k', '')),
                });
            })
            .on('progress', (progress) => {
                progressCallback(config.quality, progress.percent);
            })
            .on('error', (err, stdout, stderr) => {
                console.error(`FFmpeg error for ${config.quality}:`, err.message);
                reject(err);
            })
            .save(outputFilePath);
    });
};


/**
 * Main function to process video: compression, streaming prep, and analysis.
 */
const startProcessing = async (videoId, io) => {
  const video = await Video.findById(videoId);
  if (!video) return;

  const originalFilePath = video.filePath;
  const baseFileName = path.basename(originalFilePath, path.extname(originalFilePath));

  video.status = 'processing';
  await video.save();

  try {
    // 1. Get Duration via ffprobe
    const metadata = await new Promise((resolve, reject) => {
        ffmpeg.ffprobe(originalFilePath, (err, data) => {
            if (err) return reject(err);
            resolve(data);
        });
    });
    video.duration = metadata.format.duration;
    await video.save();

    const totalJobs = QUALITY_CONFIGS.length + 1; // +1 for sensitivity analysis
    let completedJobs = 0;
    
    const processedResults = [];

    // 2. Run FFmpeg jobs sequentially for all quality levels
    for (let i = 0; i < QUALITY_CONFIGS.length; i++) {
        const config = QUALITY_CONFIGS[i];
        const outputFileName = `${baseFileName}-${config.quality}.mp4`;
        
        const result = await runFFmpegJob(
            originalFilePath,
            outputFileName,
            config,
            (quality, percent) => {
                // Calculate overall progress across all jobs
                const jobProgress = (i / QUALITY_CONFIGS.length) * 100;
                const overallProgress = Math.floor(jobProgress + (percent / QUALITY_CONFIGS.length));
                
                if (overallProgress > video.processingProgress) {
                    video.processingProgress = overallProgress;
                    video.save(); 
                    io.to(String(video.user)).emit('videoProgress', { 
                        id: video._id, 
                        progress: overallProgress 
                    });
                }
            }
        );
        processedResults.push(result);
    }
    completedJobs = QUALITY_CONFIGS.length;

    // 3. Run Sensitivity Analysis (Analyze high quality version which is usually the first result)
    const sensitivityResult = await runSensitivityAnalysis(processedResults[0].path); 
    completedJobs++;

    // 4. Update final status and paths
    video.processedQualities = processedResults; // Save all quality paths
    video.sensitivity = sensitivityResult;
    video.status = sensitivityResult === 'flagged' ? 'flagged' : 'safe';
    video.processingProgress = 100;

    await video.save();
    
    // 5. Notify the user
    io.to(String(video.user)).emit('videoStatus', { 
        id: video._id, 
        status: video.status, 
        sensitivity: video.sensitivity,
        progress: 100,
        processedQualities: video.processedQualities // Send paths for player update
    });

  } catch (error) {
    console.error('General Processing Error/FFmpeg CRASH:', error);
    video.status = 'failed';
    await video.save();
    io.to(String(video.user)).emit('videoStatus', { id: video._id, status: 'failed' });
    // In a real application, you would add cleanup logic here to delete partial files.
  }
};

module.exports = { startProcessing };