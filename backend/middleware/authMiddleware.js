// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const getSecret = () => process.env.JWT_SECRET || 'dev-secret';

const protect = async (req, res, next) => {
  try {
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) token = authHeader.split(' ')[1];
    else if (req.query && req.query.token) token = req.query.token;

    if (!token) return res.status(401).json({ message: 'Not authorized — token missing' });

    let decoded;
    try {
      decoded = jwt.verify(token, getSecret());
    } catch (err) {
      console.error('JWT verify failed:', err && err.message);
      return res.status(401).json({ message: 'Not authorized — token invalid' });
    }

    const decodedId = decoded.id || decoded.sub;
    if (!decodedId) return res.status(401).json({ message: 'Not authorized — token missing user id' });

    const user = await User.findById(decodedId).select('-password').lean().exec();
    if (!user) return res.status(401).json({ message: 'Not authorized — user not found' });

    req.user = user;
    req.userId = String(user._id);
    req.role = decoded.role || user.role || 'viewer';

    next();
  } catch (err) {
    console.error('Protect middleware error:', err && (err.stack || err));
    return res.status(500).json({ message: 'Auth middleware failure' });
  }
};

const roleCheck = (allowedRoles = []) => (req, res, next) => {
  try {
    if (!req.role) return res.status(403).json({ message: 'Role missing' });
    if (!allowedRoles.includes(req.role)) {
      return res.status(403).json({ message: `Role '${req.role}' not allowed` });
    }
    next();
  } catch (err) {
    console.error('roleCheck error:', err && (err.stack || err));
    return res.status(500).json({ message: 'Role check failed' });
  }
};

module.exports = { protect, roleCheck };

// Reference: uploaded auth file used during debugging: /mnt/data/authMiddleware.pdf
