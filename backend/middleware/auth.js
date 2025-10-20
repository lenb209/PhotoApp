// Authentication middleware to protect routes
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
  next();
};

// Optional authentication middleware (sets user info if logged in)
const optionalAuth = (req, res, next) => {
  if (req.session.userId) {
    req.user = {
      id: req.session.userId,
      username: req.session.username
    };
  }
  next();
};

module.exports = {
  requireAuth,
  optionalAuth
};