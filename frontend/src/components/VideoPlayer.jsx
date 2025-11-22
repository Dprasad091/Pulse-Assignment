import React, { useState, useMemo } from 'react';
import styles from './VideoPlayer.module.css'; // Import modular CSS

const VideoPlayer = ({ video, userToken }) => {
  
  // NOTE: processedQualities is empty during the bypass test.
  const availableQualities = useMemo(() => {
    // If processedQualities is empty (bypass), return an array with one "Raw" option
    if (!video.processedQualities || video.processedQualities.length === 0) {
        return [{ quality: 'raw', bitrate: 0, label: 'Original (No Processing)' }];
    }
    // Otherwise, use the processed qualities and sort them
    return video.processedQualities.sort((a, b) => b.bitrate - a.bitrate);
  }, [video.processedQualities]);

  // Default to the highest available quality or the 'raw' bypass option
  const [selectedQuality, setSelectedQuality] = useState(availableQualities[0]?.quality || 'raw');

  // Construct the secure stream URL 
  const streamUrl = useMemo(() => {
    // Since we are bypassing, all requests stream the original file path.
    return `http://localhost:5000/api/videos/stream/${video._id}?token=${userToken}&quality=${selectedQuality}`;
  }, [video._id, userToken, selectedQuality]);
  
  if (video.status !== 'safe' || !streamUrl) {
      // 🔑 REMOVED CONFUSING STATUS MESSAGE:
      return <p style={{ color: 'var(--color-secondary)' }}>Video is not available for streaming yet.</p>; 
  }

  return (
    <div className={styles.playerContainer}>
      <h4>Now Playing: {video.title}</h4>
      
      <div className={styles.qualitySelector}>
          <label>Quality:</label>
          <select 
            value={selectedQuality} 
            onChange={(e) => setSelectedQuality(e.target.value)}
          >
            {availableQualities.map(q => (
                <option key={q.quality} value={q.quality}>
                    {q.quality.toUpperCase()} {q.bitrate > 0 && `(${q.bitrate} kbps)`}
                </option>
            ))}
          </select>
      </div>
      
      <video 
        controls 
        className={styles.videoElement}
        key={streamUrl} // Forces player reload when quality changes
        src={streamUrl} 
        type="video/mp4" 
      />
      <p>Duration: {video.duration ? `${Math.round(video.duration)}s` : 'N/A'}</p>
    </div>
  );
};

export default VideoPlayer;