// routes/userRoutes.js
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();
const getSecret = () => process.env.JWT_SECRET || 'dev-secret';
const generateToken = (id, role) => jwt.sign({ id, role }, getSecret(), { expiresIn: '30d' });

const sendError = (res, err) => {
  if (!err) return res.status(500).json({ message: 'Unknown error' });
  if (err.code === 11000) return res.status(409).json({ message: `${Object.keys(err.keyValue)[0]} already exists` });
  if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
  console.error('Unhandled route error:', err);
  return res.status(500).json({ message: 'Server error' });
};

// Register
router.post('/register', async (req, res) => {
  const { username, email, password, role } = req.body || {};
  if (!username || !email || !password) return res.status(400).json({ message: 'Please include username, email and password.' });

  try {
    const exists = await User.findOne({ $or: [{ email }, { username }] }).lean().exec();
    if (exists) return res.status(409).json({ message: 'Email or username already in use' });

    const user = await User.create({ username, email, password, role });
    const token = generateToken(user._id, user.role);
    return res.status(201).json({ _id: user._id, username: user.username, email: user.email, role: user.role, token });
  } catch (err) {
    return sendError(res, err);
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: 'Please enter email and password.' });

  try {
    const user = await User.findOne({ email }).select('+password').exec();
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });
    const match = await user.matchPassword(password);
    if (!match) return res.status(401).json({ message: 'Invalid email or password' });
    const token = generateToken(user._id, user.role);
    return res.json({ _id: user._id, username: user.username, email: user.email, role: user.role, token });
  } catch (err) {
    return sendError(res, err);
  }
});

module.exports = router;

