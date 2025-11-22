import React, { useState } from 'react';

const AuthScreen = ({ isLogin: initialIsLogin, handleAuthSubmit, message }) => {
  const [isLogin, setIsLogin] = useState(initialIsLogin);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('editor'); // 🔑 Captures the selected role

  const currentTitle = isLogin ? 'Welcome Back' : 'Create Account';
  const submitButtonText = isLogin ? 'Sign In' : 'Create Account';
  const subTitle = isLogin ? 'Sign in to your account' : 'Join the video moderation platform';

  const localHandleSubmit = (e) => {
      e.preventDefault();
      // Pass the selected role up to the App.jsx handler only during registration
      const finalRole = isLogin ? null : role; 
      // 🔑 Pass all necessary data including the role
      handleAuthSubmit(e, isLogin, username, email, password, finalRole);
  }
  
  const toggleAuthMode = (e) => {
      e.preventDefault();
      setIsLogin(!isLogin);
      // Reset form fields
      setUsername('');
      setEmail('');
      setPassword('');
      setRole('editor'); // Reset role
  }

  return (
    <div className="auth-container">
      {/* Sidebar (Branding) */}
      <div className="sidebar">
        <h1 className="sidebar-heading">
          <span style={{ marginRight: '8px', fontSize: '1.5em' }}>&#9654;</span>VideoStream
        </h1>
        <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>Intelligent Video Content Moderation</h2>
        <p style={{ color: 'var(--color-secondary)', marginBottom: 'var(--spacing-lg)' }}>
            Upload, process, and stream videos with AI-powered content sensitivity analysis in real-time.
        </p>
        
        <div className="feature-list">
          <p><span>✅</span> **Content Safety**<br/>Automatic detection of sensitive content with detailed analysis</p>
          <p><span>🌐</span> **Real-time Updates**<br/>Live processing progress with WebSocket notifications</p>
          <p><span>🎬</span> **Seamless Streaming**<br/>HTTP range requests for smooth video playback</p>
        </div>
      </div>

      {/* Form Card */}
      <div className="auth-form-card">
        <div className="form-card">
          <h2>{currentTitle}</h2>
          <p style={{ color: 'var(--color-secondary)', marginBottom: 'var(--spacing-lg)' }}>
            {subTitle}
          </p>

          <form onSubmit={localHandleSubmit}>
            {!isLogin && (
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required={!isLogin}
                />
              </div>
            )}
            <div className="form-group">
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            {!isLogin && (
              <div className="form-group">
                <select 
                  style={{ width: '100%' }}
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="editor">Editor (Upload & manage videos)</option>
                  <option value="viewer">Viewer (Read-only access)</option>
                  <option value="admin">Admin (Full System Access)</option> 
                </select>
              </div>
            )}

            <button type="submit" className="btn-cta">
              {submitButtonText}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 'var(--spacing-md)' }}>
            {isLogin ? (
              <a href="#" onClick={toggleAuthMode}>Don't have an account? **Sign up**</a>
            ) : (
              <a href="#" onClick={toggleAuthMode}>Already have an account? **Sign in**</a>
            )}
          </p>
          
          {message && <p style={{ color: message.startsWith('Success') ? 'var(--color-success)' : 'var(--color-danger)', textAlign: 'center' }}>{message}</p>}
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;