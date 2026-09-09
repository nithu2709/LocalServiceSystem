const jwt = require('jsonwebtoken');
const { query } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'localservice_secret_key_cloud_architecture_2026';

// Middleware to authenticate user via JWT or x-user-id
const authenticateUser = async (req, res, next) => {
  try {
    let userId = null;

    // Check for Bearer token in Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.id;
      } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired authentication token.' });
      }
    } else if (req.headers['x-user-id']) {
      // Fallback for simple local direct testing / demo mode
      userId = parseInt(req.headers['x-user-id'], 10);
    }

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required. Please log in.' });
    }

    // Fetch user from DB
    const userRes = await query(
      'SELECT id, name, email, phone, role, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: 'User not found.' });
    }

    const user = userRes.rows[0];

    // If role is PROVIDER, get provider details
    if (user.role === 'PROVIDER') {
      const providerRes = await query(
        `SELECT sp.id AS provider_id, sp.category_id, sp.experience, sp.availability, sp.location, sc.name AS category_name
         FROM service_providers sp
         LEFT JOIN service_categories sc ON sp.category_id = sc.id
         WHERE sp.user_id = $1`,
        [user.id]
      );
      if (providerRes.rows.length > 0) {
        user.provider = providerRes.rows[0];
      }
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication processing failed.' });
  }
};

// Role-based access control middleware
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Requires one of roles: ${roles.join(', ')}. Current role: ${req.user.role}`,
      });
    }
    next();
  };
};

module.exports = {
  authenticateUser,
  requireRole,
  JWT_SECRET,
};
