const { verifyToken } = require('../config/auth');
const logger = require('../utils/logger');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    logger.warn('No token provided');
    return res.status(401).json({ error: 'Access token required' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    logger.warn('Invalid token provided');
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  req.user = decoded;
  next();
};

const authorizeRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!roles.includes(req.user.role)) {
      logger.warn(`Unauthorized access attempt by user ${req.user.userId}`);
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRole,
};
