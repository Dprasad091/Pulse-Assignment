// routes/adminRoutes.js
const express = require('express');
const User = require('../models/User');
const { protect, roleCheck } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes here require admin
router.use(protect, roleCheck(['admin']));

/**
 * GET /api/admin/users
 * List users (pagination + basic filters)
 */
router.get('/users', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, parseInt(req.query.limit || '50', 10));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.email) filter.email = String(req.query.email).toLowerCase().trim();

    const [users, total] = await Promise.all([
      User.find(filter).select('-password').skip(skip).limit(limit).sort({ createdAt: -1 }),
      User.countDocuments(filter),
    ]);

    res.json({ page, limit, total, users });
  } catch (err) {
    console.error('Admin GET users failed:', err);
    res.status(500).json({ message: 'Failed to list users' });
  }
});

/**
 * GET /api/admin/users/:id
 * Get user by id
 */
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('Admin GET user failed:', err);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

/**
 * PUT /api/admin/users/:id
 * Update user fields (role, username, email). If changing role, only valid roles allowed.
 */
router.put('/users/:id', async (req, res) => {
  try {
    const updates = {};
    const { username, email, role } = req.body;

    if (username) updates.username = String(username).trim();
    if (email) updates.email = String(email).toLowerCase().trim();
    if (role) {
      const valid = ['viewer', 'editor', 'admin'];
      if (!valid.includes(role)) return res.status(400).json({ message: `Invalid role. Valid: ${valid.join(', ')}` });
      updates.role = role;
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user);
  } catch (err) {
    console.error('Admin update user failed:', err);
    if (err && err.code === 11000) return res.status(400).json({ message: 'Email or username already in use' });
    res.status(500).json({ message: 'Failed to update user' });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Remove user (and optionally cascade cleanup)
 */
router.delete('/users/:id', async (req, res) => {
  try {
    // Prevent admin from deleting self accidentally
    if (String(req.userId) === String(req.params.id)) {
      return res.status(400).json({ message: 'Admins cannot delete themselves via this endpoint' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    await User.deleteOne({ _id: req.params.id });
    // NOTE: optionally delete user videos, files, etc. Add cleanup here as needed.

    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error('Admin delete user failed:', err);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

module.exports = router;
