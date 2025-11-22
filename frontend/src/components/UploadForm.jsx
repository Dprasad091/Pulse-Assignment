// UploadForm.jsx
import React, { useState, useRef } from 'react';
import axios from 'axios';
import styles from './UploadForm.module.css'; // Keep your CSS module

const API_URL = 'http://localhost:5000/api/videos/upload';

const UploadForm = ({ onUploadSuccess }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef(null);

  const userInfo = (() => { try { return JSON.parse(localStorage.getItem('userInfo')); } catch { return null; } })();
  const token = userInfo?.token;

  const resetForm = () => { setTitle(''); setDescription(''); setFile(null); setUploadProgress(0); if (fileInputRef.current) fileInputRef.current.value = ''; };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!file || !title.trim()) { setMessage('Please select a video file and provide a valid title.'); return; }
    if (!token) { setMessage('Authorization token missing. Please log in again.'); return; }

    const formData = new FormData();
    // CRITICAL: The field name 'video' MUST match Multer's upload.single('video') in videoRoutes.js
    formData.append('video', file); 
    formData.append('title', title.trim());
    if (description) formData.append('description', description.trim());

    try {
      setUploading(true); 
      setMessage('Uploading...'); 
      setUploadProgress(0);

      const config = {
        headers: { Authorization: `Bearer ${token}` },
        // Use progressEvent for standard Axios naming convention
        onUploadProgress: (progressEvent) => { 
            if (!progressEvent.total) return; 
            setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total)); 
        }
      };

      const { data } = await axios.post(API_URL, formData, config);

      setMessage(`Upload complete — processing started for "${data.video?.title || 'your video'}"`);
      
      if (onUploadSuccess) onUploadSuccess(data.video || data);
      
      // Order: Clear form, then stop loading state
      resetForm();
      setUploading(false);
    } catch (err) {
      console.error('Upload error:', err);
      setUploading(false); 
      setUploadProgress(0);
      
      // 🔑 IMPROVED ERROR CAPTURE: Prioritize structured server message
      const errMsg = 
        err?.response?.data?.message || 
        (err?.response?.data?.details && `Validation Failed: ${JSON.stringify(err.response.data.details)}`) ||
        err.message || 
        'Upload failed due to a server error.';
        
      setMessage(errMsg);
    }
  };

  return (
    <div className={styles.formContainer}>
      <h3>Upload New Video</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
            <input type="text" placeholder="Video Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="form-group">
            <textarea placeholder="Description (Optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="form-group">
            <input ref={fileInputRef} type="file" accept="video/*" onChange={(e) => setFile(e.target.files[0] || null)} required />
        </div>
        <button type="submit" disabled={uploading || !token}>{uploading ? 'Uploading...' : 'Start Upload'}</button>
      </form>

      {uploading && (
        <div className={styles.uploadProgress}>
          Progress: {uploadProgress}%
          <div className={styles.progressBar}><div className={styles.progressFill} style={{ width: `${uploadProgress}%` }} /></div>
        </div>
      )}

      {message && <p className={message.toLowerCase().includes('failed') || message.toLowerCase().includes('error') ? styles.messageError : styles.messageSuccess}>{message}</p>}
    </div>
  );
};

export default UploadForm;