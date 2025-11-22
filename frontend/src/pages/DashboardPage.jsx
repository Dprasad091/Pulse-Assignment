import React from 'react';
import { Link } from 'react-router-dom';

const DashboardPage = ({ videos, canUpload }) => {
  // Calculate stats
  const totalVideos = videos.length;
  const safeContent = videos.filter(v => v.sensitivity === 'safe').length;
  const processing = videos.filter(v => v.status === 'processing' || v.status === 'pending').length;
  const flagged = videos.filter(v => v.sensitivity === 'flagged').length;

  const stats = [
    { label: 'Total Videos', count: totalVideos, icon: '📹', color: 'blue' },
    { label: 'Safe Content', count: safeContent, icon: '✅', color: 'green' },
    { label: 'Processing', count: processing, icon: '🟡', color: 'yellow' },
    { label: 'Flagged', count: flagged, icon: '⚠️', color: 'red' },
  ];

  const currentProcessing = videos.filter(v => v.status === 'processing' || v.status === 'pending').slice(0, 3);

  const getProgressColor = (status) => {
    if (status === 'safe') return 'var(--color-success)';
    if (status === 'flagged') return 'var(--color-danger)';
    return 'var(--color-warning)';
  };

  return (
    <div className="page-content">
      <h2 style={{ marginBottom: 'var(--spacing-sm)' }}>Welcome back, {processing.user?.role || 'admin'}!</h2>
      <p style={{ color: 'var(--color-secondary)', marginBottom: 'var(--spacing-lg)' }}>Here's what's happening with your video content</p>

      {/* 1. Stats Grid (Matching Screenshot) */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
        {stats.map(stat => (
          <div key={stat.label} className="stat-card" style={{ padding: 'var(--spacing-md)', background: 'white', borderRadius: 'var(--border-radius-base)', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: `5px solid var(--color-${stat.color})` }}>
            <div className={`icon-wrapper`} style={{ fontSize: '1.5rem', color: `var(--color-${stat.color})` }}>{stat.icon}</div>
            <p className="count" style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: '0' }}>{stat.count}</p>
            <p className="label" style={{ color: 'var(--color-secondary)', margin: '0' }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* 2. CTA Section (Matches Screenshot) */}
      {canUpload && (
        <div className="cta-section" style={{ background: 'linear-gradient(90deg, #5c6bc0, #7986cb)', padding: 'var(--spacing-md)', borderRadius: 'var(--border-radius-base)', color: 'white', marginBottom: 'var(--spacing-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ color: 'white', marginBottom: 'var(--spacing-xs)' }}>Upload New Video</h3>
            <p style={{ color: '#fff', opacity: 0.8 }}>Add content to your library</p>
          </div>
          <Link to="/upload" style={{ background: 'white', color: 'var(--color-primary)', padding: '10px 20px', borderRadius: 'var(--border-radius-base)', fontWeight: 'bold' }}>
            Upload Video
          </Link>
        </div>
      )}

      {/* 3. Current Processing */}
      <h3 style={{ marginTop: 'var(--spacing-lg)' }}>Currently Processing</h3>
      <div className="processing-list">
        {currentProcessing.length > 0 ? currentProcessing.map(v => (
            <div key={v._id} style={{ background: 'white', padding: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)', borderRadius: 'var(--border-radius-base)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <p style={{ margin: 0, fontWeight: 'bold' }}>{v.title}</p>
                <div style={{ height: '10px', background: '#eee', borderRadius: '5px', overflow: 'hidden', marginTop: 'var(--spacing-xs)' }}>
                    <div style={{ width: `${v.processingProgress}%`, height: '100%', background: getProgressColor(v.status) }}></div>
                </div>
                <p style={{ fontSize: '0.8em', color: 'var(--color-secondary)', margin: 0 }}>Status: {v.status.toUpperCase()} ({v.processingProgress}%)</p>
            </div>
        )) : <p>No videos currently processing.</p>}
      </div>

    </div>
  );
};

export default DashboardPage;