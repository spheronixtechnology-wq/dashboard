const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role && req.user.role.toUpperCase() === 'ADMIN') {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as an admin' });
  }
};

const instructor = (req, res, next) => {
  // Debug Log (To be removed later)
  if (req.user) {
      console.log('ROLE:', req.user.role);
  } else {
      console.log('ROLE: req.user is undefined');
  }

  if (req.user && req.user.role) {
    const role = req.user.role.trim().toUpperCase();
    if (role === 'INSTRUCTOR' || role === 'ADMIN') {
        return next();
    }
  }
  
  res.status(401).json({ message: 'Not authorized as an instructor' });
};

module.exports = { protect, admin, instructor };
