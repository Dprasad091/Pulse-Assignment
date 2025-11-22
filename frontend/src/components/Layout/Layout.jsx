import React from 'react';
import Sidebar from './Sidebar';

const Layout = ({ user, handleLogout, children }) => {
  return (
    <div className="dashboard-layout-wrapper" style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-background)' }}>
      {/* Left Sidebar */}
      <Sidebar user={user} handleLogout={handleLogout} />
      
      {/* Main Content Area */}
      <main className="main-content-area" style={{ flexGrow: 1, padding: 'var(--spacing-lg)', overflowY: 'auto' }}>
        <header style={{ borderBottom: '1px solid #eee', paddingBottom: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{fontSize: '1.8rem', fontWeight: 'bold'}}>Dashboard</div>
            <div className="header-info" style={{ color: 'var(--color-secondary)' }}>
                TechCorp Media
            </div>
        </header>
        {children}
      </main>
    </div>
  );
};

export default Layout;