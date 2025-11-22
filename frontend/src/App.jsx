import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client'; 

// Components and Pages
import AuthScreen from './pages/AuthScreen';
import Layout from './components/Layout/Layout';
import DashboardPage from './pages/DashboardPage';
import VideoLibraryPage from './pages/VideoLibraryPage';
import AdminPanelPage from './pages/AdminPanelPage';
import SettingsPage from './pages/SettingsPage';
import UploadPage from './pages/UploadPage'; 

import './index.css'; 

const API_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000'; 

let socket; 

function App() {
  const [user, setUser] = useState(null);
  const [videos, setVideos] = useState([]);
  const [message, setMessage] = useState('');
  
  // Filtering States
  const [filterSensitivity, setFilterSensitivity] = useState('');
  const [sortOption, setSortOption] = useState('');

  // RBAC Helpers
  const canUpload = user && (user.role === 'editor' || user.role === 'admin');
  const isAdmin = user && user.role === 'admin';

  // --- 1. Authentication State Management & Handlers ---
  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      setUser(JSON.parse(userInfo));
    }
  }, []);
  
  // 🔑 UPDATED: Now receives finalRole from AuthScreen
  const handleAuthSubmit = async (e, isLogin, username, email, password, finalRole) => {
    e.preventDefault();
    setMessage('');
    const endpoint = isLogin ? '/login' : '/register';
    
    // 🔑 Conditional body creation to include role only for registration
    const body = isLogin 
        ? { email, password } 
        : { username, email, password, role: finalRole }; 

    try {
      const response = await axios.post(`${API_URL}/users${endpoint}`, body);
      localStorage.setItem('userInfo', JSON.stringify(response.data));
      setUser(response.data);
      setMessage(`Success! Role: ${response.data.role}`);
    } catch (error) {
      setMessage(error.response?.data?.message || 'An error occurred');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    setUser(null);
    setVideos([]);
  };

  // --- 2. Data Fetching and Real-Time Updates (Logic remains the same) ---
  
  const fetchVideos = async () => {
    const token = user?.token;
    if (!token) return;
    try {
      const config = {
        headers: { Authorization: `Bearer ${token}` },
        params: { sensitivity: filterSensitivity, sort: sortOption }
      };
      const { data } = await axios.get(`${API_URL}/videos`, config);
      setVideos(data);
    } catch (error) {
      console.error('Error fetching videos:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchVideos();
    } else {
      setVideos([]);
    }
  }, [user, filterSensitivity, sortOption]);

  // Socket.io Connection & Handlers (Logic remains the same)
  useEffect(() => {
    if (user && user._id) {
      socket = io(SOCKET_URL);
      socket.emit('joinRoom', user._id); 

      socket.on('videoProgress', (update) => {
        setVideos(prevVideos => 
          prevVideos.map(v =>
            v._id === update.id ? { ...v, processingProgress: update.progress, status: 'processing' } : v
          )
        );
      });

      socket.on('videoStatus', (update) => {
        setVideos(prevVideos => 
          prevVideos.map(v =>
            v._id === update.id ? { 
              ...v, 
              status: update.status, 
              sensitivity: update.sensitivity || v.sensitivity,
              processedQualities: update.processedQualities || v.processedQualities,
              processingProgress: 100 
            } : v
          )
        );
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [user]); 
  
  const handleVideoUpdate = (newVideo) => {
    setVideos((prevVideos) => [newVideo, ...prevVideos]);
  };
  
  const handleDeleteVideo = async (videoId) => {
    if (!window.confirm('Are you sure you want to delete this video?')) return;
    const token = user?.token;
    if (!token) return;
    try {
      await axios.delete(`${API_URL}/videos/${videoId}`, { headers: { Authorization: `Bearer ${token}` } });
      setVideos(prevVideos => prevVideos.filter(v => v._id !== videoId));
    } catch (error) {
      alert(error.response?.data?.message || 'Deletion failed.');
      console.error('Deletion error:', error);
    }
  };

  // --- 3. Routing Logic ---

  if (!user) {
    return (
      <AuthScreen 
        isLogin={true} 
        handleAuthSubmit={handleAuthSubmit} 
        message={message} 
      />
    );
  }

  const sharedProps = {
    user,
    videos,
    canUpload,
    isAdmin,
    fetchVideos,
    handleDeleteVideo,
    handleVideoUpdate,
    filterSensitivity,
    setFilterSensitivity,
    sortOption,
    setSortOption,
    handleLogout
  };

  return (
    <BrowserRouter>
      <Layout {...sharedProps}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage {...sharedProps} />} />
          
          <Route path="/upload" element={canUpload ? <UploadPage {...sharedProps} /> : <Navigate to="/dashboard" replace />} />
          
          <Route path="/library" element={<VideoLibraryPage {...sharedProps} />} />
          
          <Route path="/admin" element={isAdmin ? <AdminPanelPage {...sharedProps} /> : <Navigate to="/dashboard" replace />} /> 

          <Route path="/settings" element={<SettingsPage {...sharedProps} />} /> 

          <Route path="*" element={<h1 style={{padding: '50px'}}>404 Not Found</h1>} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;