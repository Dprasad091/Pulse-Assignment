import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = ({ user, handleLogout }) => {
  const isAdmin = user.role === 'admin';
  const isEditor = user.role === 'editor';

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { to: '/upload', label: 'Upload Video', icon: '🎥', requiredRole: 'editor' },
    { to: '/library', label: 'Video Library', icon: '📚' },
    { to: '/admin', label: 'Admin Panel', icon: '🛡️', requiredRole: 'admin' },
    { to: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="sidebar-container" style={{ width: '250px', background: 'white', height: '100vh', padding: 'var(--spacing-md)', boxShadow: '2px 0 5px rgba(0,0,0,0.05)', position: 'sticky', top: 0 }}>
      <div className="sidebar-header" style={{ textAlign: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <h2 className="sidebar-heading" style={{ fontSize: '1.5rem', color: 'var(--color-primary)', borderBottom: '1px solid #eee', paddingBottom: 'var(--spacing-md)' }}>VideoStream</h2>
        <div className="user-profile" style={{ padding: 'var(--spacing-md)', border: '1px solid #eee', borderRadius: 'var(--border-radius-base)', marginTop: 'var(--spacing-md)', display: 'flex', alignItems: 'center' }}>
          <div className="avatar" style={{ background: 'var(--color-primary)', color: 'white', width: '40px', height: '40px', borderRadius: '50%', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', marginRight: 'var(--spacing-sm)', fontWeight: 'bold' }}>
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div className="user-info" style={{ textAlign: 'left' }}>
            <span className="username" style={{ fontWeight: 'bold', display: 'block' }}>{user.username}</span>
            <span className="role" style={{ fontSize: '0.9em', color: 'var(--color-secondary)' }}>{user.role}</span>
          </div>
        </div>
      </div>
      
      <nav className="sidebar-nav">
        {navItems.map(item => {
          if (item.requiredRole === 'admin' && !isAdmin) return null;
          if (item.requiredRole === 'editor' && !isEditor && !isAdmin) return null;

          return (
            <NavLink key={item.to} to={item.to} 
              className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                padding: 'var(--spacing-sm)', 
                marginBottom: 'var(--spacing-xs)', 
                borderRadius: 'var(--border-radius-base)', 
                textDecoration: 'none', 
                color: 'var(--color-text-dark)', 
                background: 'transparent',
                transition: 'background 0.2s',
              }}
              activeStyle={{ 
                background: '#f0f0ff', 
                color: 'var(--color-primary)', 
                fontWeight: 'bold' 
              }} 
            >
              <span className="icon" style={{ marginRight: 'var(--spacing-md)' }}>{item.icon}</span>
              <span className="label">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <button onClick={handleLogout} className="logout-button btn-cta" style={{ marginTop: 'var(--spacing-lg)', width: '100%', background: 'var(--color-danger)' }}>Logout</button>
    </div>
  );
};

export default Sidebar;