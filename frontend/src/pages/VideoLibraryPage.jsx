import React, { useState } from 'react';
import VideoPlayer from '../components/VideoPlayer';

const VideoLibraryPage = ({ 
  videos, 
  user, 
  handleDeleteVideo, 
  filterSensitivity, 
  setFilterSensitivity, 
  sortOption, 
  setSortOption 
}) => {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const canDelete = user.role === 'editor' || user.role === 'admin';

  // Helper function for status badges
  const getStatusColor = (status) => {
    if (status === 'safe') return 'var(--color-success)';
    if (status === 'flagged') return 'var(--color-danger)';
    return 'var(--color-warning)'; // Pending/Processing
  };
  
  const userToken = user?.token;

  return (
    <div className="page-content">
      <h2>Video Library</h2>
      <p style={{ color: 'var(--color-secondary)', marginBottom: 'var(--spacing-lg)' }}>Manage and organize your video content</p>

      {/* 1. Filtering & Search Bar (Matching Screenshot) */}
      <div className="library-controls-bar" style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
        <input type="text" placeholder="Search videos..." style={{ flexGrow: 1, padding: 'var(--spacing-sm)' }} />
        
        {/* Status Filter */}
        <select value={filterSensitivity} onChange={(e) => setFilterSensitivity(e.target.value)} style={{ padding: 'var(--spacing-sm)' }}>
          <option value="">All Status</option>
          <option value="safe">Safe</option>
          <option value="flagged">Flagged</option>
          <option value="unchecked">Processing/Pending</option>
        </select>
        
        {/* Sort Filter */}
        <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} style={{ padding: 'var(--spacing-sm)' }}>
          <option value="">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
        
        {/* Grid/List Toggle (Placeholder) */}
        <button style={{ background: 'var(--color-secondary)' }}>Grid</button>
      </div>

      <p style={{ color: 'var(--color-secondary)', marginBottom: 'var(--spacing-lg)' }}>Showing {videos.length} of {videos.length} videos</p>

      {/* 2. Video Player Area (Renders when a video is selected) */}
      {selectedVideo && (
        <div className="player-wrapper" style={{ marginBottom: 'var(--spacing-lg)' }}> 
          <h3>Now Playing: {selectedVideo.title}</h3>
          <VideoPlayer video={selectedVideo} userToken={userToken} />
          <button onClick={() => setSelectedVideo(null)} style={{ background: 'var(--color-secondary)' }}>Close Player</button>
        </div>
      )}

      {/* 3. Video Grid (Matching Screenshot) */}
      <div className="video-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--spacing-lg)' }}>
        {videos.map(v => (
          <div key={v._id} className="video-card" style={{ background: 'white', padding: 'var(--spacing-md)', borderRadius: 'var(--border-radius-base)', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', position: 'relative' }}>
            
            {/* Thumbnail Placeholder */}
            <div className="thumbnail-placeholder" style={{ background: '#333', height: '150px', borderRadius: 'var(--border-radius-base)', marginBottom: 'var(--spacing-sm)', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <span style={{ fontSize: '3em' }}>🎥</span>
            </div> 
            
            <div className="card-info">
              <h4 style={{ fontSize: '1.1em', marginBottom: 'var(--spacing-xs)' }}>{v.title}</h4>
              <p className="metadata" style={{ fontSize: '0.9em', color: 'var(--color-secondary)' }}>{(v.fileSize / 1024 / 1024).toFixed(1)} MB • {new Date(v.createdAt).toLocaleDateString()}</p>
              
              {/* Status Badge */}
              <span className="status-badge" style={{ display: 'inline-block', padding: '4px 8px', borderRadius: '12px', background: getStatusColor(v.status), color: 'white', fontSize: '0.8em', marginTop: 'var(--spacing-sm)' }}>
                {v.status.toUpperCase()}
              </span>

              {/* Progress Bar for Pending/Processing */}
              {(v.status === 'processing' || v.status === 'pending') && (
                <div className="progress-bar-wrap" style={{ marginTop: 'var(--spacing-sm)' }}>
                    <div style={{ height: '5px', background: '#eee', borderRadius: '5px', overflow: 'hidden' }}>
                        <div style={{ width: `${v.processingProgress}%`, height: '100%', background: getProgressColor(v.status) }}></div>
                    </div>
                    <p style={{ fontSize: '0.7em', color: 'var(--color-secondary)', margin: 0 }}>Processing: {v.processingProgress}%</p>
                </div>
              )}
            </div>
            
            {/* Actions */}
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-md)' }}>
                {v.status === 'safe' && (
                  <button onClick={() => setSelectedVideo(v)} style={{ background: 'var(--color-success)', flexGrow: 1 }}>Stream</button>
                )}
                {canDelete && (
                  <button 
                    onClick={() => handleDeleteVideo(v._id)} 
                    disabled={v.status === 'processing' || v.status === 'pending'}
                    style={{ background: 'var(--color-danger)', width: '30px', padding: '8px 0' }}
                  >
                    🗑️
                  </button>
                )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VideoLibraryPage;