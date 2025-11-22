import React from 'react';
import UploadForm from '../components/UploadForm';

const UploadPage = ({ handleVideoUpdate }) => {
  return (
    <div className="page-content">
      <h2>Upload Video</h2>
      <p style={{ color: 'var(--color-secondary)', marginBottom: 'var(--spacing-lg)' }}>Share your content with automatic sensitivity analysis</p>
      
      {/* UploadForm component contains the Multer logic and progress bars */}
      <UploadForm onUploadSuccess={handleVideoUpdate} />
      
      <p style={{ marginTop: 'var(--spacing-lg)', color: 'var(--color-secondary)' }}>Note: Videos are processed for multiple quality levels after upload is complete.</p>
    </div>
  );
};

export default UploadPage;