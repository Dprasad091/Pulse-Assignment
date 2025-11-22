import React, { useState, useMemo } from 'react';
import styles from './VideoPlayer.module.css'; // Import modular CSS

const VideoPlayer = ({ video, userToken }) => {
  // Sort available qualities by bitrate (highest first)
  const availableQualities = useMemo(() => {
    return video.processedQualities ? video.processedQualities.sort((a, b) => b.bitrate - a.bitrate) : [];
  }, [video.processedQualities]);

  // Default to the highest available quality
  const [selectedQuality, setSelectedQuality] = useState(availableQualities[0]?.quality || '');

  // Construct the secure stream URL based on the selected quality and token
  const streamUrl = useMemo(() => {
    if (!selectedQuality) return '';
    // Append token and quality as query parameters for authentication and quality selection
    return `http://localhost:5000/api/videos/stream/${video._id}?token=${userToken}&quality=${selectedQuality}`;
  }, [video._id, userToken, selectedQuality]);
  
  if (video.status !== 'safe' || !streamUrl) {
    return <p>Video status: **{video.status.toUpperCase()}**. Cannot stream yet.</p>;
  }

  return (
    <div className={styles.playerContainer}>
      <h4>Now Playing: {video.title}</h4>
      
      {availableQualities.length > 1 && (
        <div className={styles.qualitySelector}>
            <label>Quality:</label>
            <select 
              value={selectedQuality} 
              onChange={(e) => setSelectedQuality(e.target.value)}
            >
              {availableQualities.map(q => (
                  <option key={q.quality} value={q.quality}>
                      {q.quality.toUpperCase()} ({q.bitrate} kbps)
                  </option>
              ))}
            </select>
        </div>
      )}
      
      <video 
        controls 
        className={styles.videoElement}
        key={streamUrl} // Key change forces the video element to reload the new source
        src={streamUrl} 
        type="video/mp4" 
      />
      <p>Duration: {video.duration ? `${Math.round(video.duration)}s` : 'N/A'}</p>
    </div>
  );
};

export default VideoPlayer;