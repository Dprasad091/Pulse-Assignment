import React from 'react';
import { useNavigate } from 'react-router-dom';

// Note: This component assumes the user is an Admin due to the RBAC route guard in App.jsx

const AdminPanelPage = ({ user }) => {
    const navigate = useNavigate();

    // Placeholder data matching the Admin Panel screenshot
    const stats = [
        { label: 'Total Users', count: 4, icon: '👥', color: 'blue', secondaryColor: '#e3f2fd' },
        { label: 'Active Users', count: 4, icon: '📈', color: 'green', secondaryColor: '#e8f5e9' },
        { label: 'Total Videos', count: 35, icon: '📹', color: 'primary', secondaryColor: '#ede7f6' },
        { label: 'Administrators', count: 1, icon: '👑', color: 'orange', secondaryColor: '#fff3e0' },
    ];
    
    // Placeholder user management list
    const users = [
        { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Editor', videos: 12, joined: '15/01/2024', status: 'active' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'Viewer', videos: 0, joined: '20/02/2024', status: 'active' },
        { id: 3, name: 'Mike Johnson', email: 'mike@example.com', role: 'Editor', videos: 8, joined: '10/01/2024', status: 'active' },
        { id: 4, name: 'Sarah Williams', email: 'sarah@example.com', role: 'Admin', videos: 15, joined: '01/12/2023', status: 'active' },
    ];

    // Helper to get the correct role badge color
    const getRoleBadgeStyle = (role) => {
        if (role === 'Admin') return { background: 'var(--color-warning)', color: 'var(--color-text-dark)' };
        if (role === 'Editor') return { background: 'var(--color-primary)', color: 'var(--color-text-light)' };
        return { background: 'var(--color-secondary)', color: 'var(--color-text-light)' };
    };

    return (
        <div className="page-content">
            <h2>Admin Panel</h2>
            <p className="subtitle" style={{ color: 'var(--color-secondary)', marginBottom: 'var(--spacing-lg)' }}>Manage users and system settings</p>

            {/* Stats Grid */}
            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)' }}>
                {stats.map(stat => (
                    <div key={stat.label} className="stat-card" style={{ padding: 'var(--spacing-md)', background: 'white', borderRadius: 'var(--border-radius-base)', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        <div className="stat-icon" style={{ fontSize: '1.8rem', color: `var(--color-primary)`, marginBottom: 'var(--spacing-sm)' }}>{stat.icon}</div>
                        <p className="count" style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: '0' }}>{stat.count}</p>
                        <p className="label" style={{ color: 'var(--color-secondary)', margin: '0' }}>{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* User Management Table */}
            <div className="user-management card" style={{ padding: 'var(--spacing-lg)', background: 'white', borderRadius: 'var(--border-radius-base)', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <h3>User Management</h3>
                <div className="table-controls" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-md)' }}>
                    <input type="text" placeholder="Search users..." style={{ width: '30%', padding: 'var(--spacing-sm)' }} />
                    <button className="btn-primary" style={{ width: 'auto' }}>+ Add User</button>
                </div>

                <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: 'var(--spacing-md)' }}>
                    <thead>
                        <tr style={{ background: '#f8f9fa' }}>
                            {['USER', 'ROLE', 'VIDEOS', 'JOINED', 'LAST ACTIVE', 'STATUS', 'ACTIONS'].map(header => (
                                <th key={header} style={{ textAlign: 'left', padding: 'var(--spacing-sm)', borderBottom: '1px solid #ddd' }}>{header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id}>
                                <td style={{ padding: 'var(--spacing-sm)', display: 'flex', alignItems: 'center' }}>
                                    <div className="avatar" style={{ background: '#ddd', color: 'var(--color-text-dark)', width: '30px', height: '30px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', marginRight: 'var(--spacing-sm)' }}>{user.name.charAt(0)}</div>
                                    <div>
                                        <div style={{ fontWeight: 'bold' }}>{user.name}</div>
                                        <div style={{ fontSize: '0.8em', color: 'var(--color-secondary)' }}>{user.email}</div>
                                    </div>
                                </td>
                                <td style={{ padding: 'var(--spacing-sm)' }}>
                                    <span className="badge" style={{ ...getRoleBadgeStyle(user.role), padding: '2px 8px', borderRadius: '12px', fontSize: '0.8em' }}>{user.role}</span>
                                </td>
                                <td style={{ padding: 'var(--spacing-sm)' }}>{user.videos}</td>
                                <td style={{ padding: 'var(--spacing-sm)' }}>{user.joined}</td>
                                <td style={{ padding: 'var(--spacing-sm)' }}>22/11/2025</td> {/* Static Last Active for demo */}
                                <td style={{ padding: 'var(--spacing-sm)' }}>
                                    <span style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>{user.status}</span>
                                </td>
                                <td style={{ padding: 'var(--spacing-sm)' }}>...</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminPanelPage;