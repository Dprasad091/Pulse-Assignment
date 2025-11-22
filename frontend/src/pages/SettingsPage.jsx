import React, { useState } from 'react';

const SettingsPage = ({ user }) => {
    // Simple state management for settings forms (not connected to API)
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');

    const handlePasswordUpdate = (e) => {
        e.preventDefault();
        // API call to update password would go here
        alert("Password update logic would connect to /api/users/update-password");
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
    };

    return (
        <div className="page-content">
            <h2>Settings</h2>
            <p style={{ color: 'var(--color-secondary)', marginBottom: 'var(--spacing-lg)' }}>Manage your account settings and preferences</p>

            <div className="settings-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)' }}>

                {/* Left Column: Profile & Notifications */}
                <div className="settings-card" style={{ background: 'white', padding: 'var(--spacing-lg)', borderRadius: 'var(--border-radius-base)', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    
                    <h3>Profile Settings</h3>
                    <div style={{ borderBottom: '1px solid #eee', paddingBottom: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
                        <p style={{ fontWeight: 'bold' }}>Full Name: {user.username}</p>
                        <p style={{ fontWeight: 'bold' }}>Email Address: {user.email}</p>
                        <p style={{ fontWeight: 'bold' }}>Role: {user.role.toUpperCase()}</p>
                    </div>

                    <h3>Notification Preferences</h3>
                    {[
                        "Upload Complete",
                        "Processing Complete",
                        "Content Flagged",
                        "Weekly Report"
                    ].map(setting => (
                        <div key={setting} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--spacing-sm) 0', borderBottom: '1px solid #f8f8f8' }}>
                            <label>{setting}</label>
                            <input type="checkbox" defaultChecked />
                        </div>
                    ))}

                </div>

                {/* Right Column: Security */}
                <div className="settings-card" style={{ background: 'white', padding: 'var(--spacing-lg)', borderRadius: 'var(--border-radius-base)', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <h3>Security (Update Password)</h3>
                    <form onSubmit={handlePasswordUpdate}>
                        <div className="form-group">
                            <label>Current Password</label>
                            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label>New Password</label>
                            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label>Confirm New Password</label>
                            <input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} required />
                        </div>
                        <button type="submit" className="btn-cta" style={{ background: 'var(--color-primary)' }}>Update Password</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;