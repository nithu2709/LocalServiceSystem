const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../db');
const { authenticateUser, JWT_SECRET } = require('../middleware/auth');
const { ALLOWED_CATEGORIES } = require('./categories');

/**
 * Helper to generate JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

/**
 * POST /api/auth/register
 * Register a new user (Customer, Provider, or Admin)
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, role, category_id, experience, location } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required.' });
    }

    const normalizedRole = role.toUpperCase();
    if (!['CUSTOMER', 'PROVIDER', 'ADMIN'].includes(normalizedRole)) {
      return res.status(400).json({ error: 'Role must be CUSTOMER, PROVIDER, or ADMIN.' });
    }

    // Check if email already exists
    const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    // If provider, check valid category
    if (normalizedRole === 'PROVIDER') {
      if (!category_id) {
        return res.status(400).json({ error: 'Service category is required for service providers.' });
      }

      // Check category is one of the 3 allowed categories
      const catCheck = await query(
        `SELECT id, name FROM service_categories WHERE id = $1 AND name = ANY($2)`,
        [category_id, ALLOWED_CATEGORIES]
      );
      if (catCheck.rows.length === 0) {
        return res.status(400).json({
          error: `Invalid category. Must be one of: ${ALLOWED_CATEGORIES.join(', ')}`,
        });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Insert user
    const userInsert = await query(
      `INSERT INTO users (name, email, password_hash, phone, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, phone, role, created_at`,
      [name.trim(), email.toLowerCase().trim(), password_hash, phone || null, normalizedRole]
    );

    const newUser = userInsert.rows[0];

    // If provider, insert into service_providers
    if (normalizedRole === 'PROVIDER') {
      const providerInsert = await query(
        `INSERT INTO service_providers (user_id, category_id, experience, availability, location)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id AS provider_id, category_id, experience, availability, location`,
        [newUser.id, category_id, experience || '1+ years experience', true, location || 'Local Service Area']
      );
      newUser.provider = providerInsert.rows[0];
    }

    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      message: 'Registration successful!',
      token,
      user: newUser,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed. ' + error.message });
  }
});

/**
 * POST /api/auth/login
 * Authenticate with email & password
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const result = await query(
      'SELECT id, name, email, password_hash, phone, role, created_at FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = result.rows[0];

    // Validate password (supports bcrypt hash or direct match if seeded)
    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(password, user.password_hash);
    } catch {
      isMatch = false;
    }

    if (!isMatch && password === user.password_hash) {
      isMatch = true;
    }

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Attach provider info if role is PROVIDER
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

    delete user.password_hash;
    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Login successful!',
      token,
      user,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed. ' + error.message });
  }
});

/**
 * GET /api/auth/me
 * Fetch current authenticated user
 */
router.get('/me', authenticateUser, (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

/**
 * GET /api/auth/demo-users
 * Returns list of available demo users for 1-click quick switching
 */
router.get('/demo-users', async (req, res) => {
  try {
    const usersRes = await query(
      `SELECT u.id, u.name, u.email, u.role, u.phone,
              sp.id AS provider_id, sp.category_id, sc.name AS category_name, sp.availability
       FROM users u
       LEFT JOIN service_providers sp ON u.id = sp.user_id
       LEFT JOIN service_categories sc ON sp.category_id = sc.id
       ORDER BY u.id ASC`
    );

    res.json({
      success: true,
      users: usersRes.rows,
    });
  } catch (error) {
    console.error('Error fetching demo users:', error);
    res.status(500).json({ error: 'Failed to fetch demo users.' });
  }
});

module.exports = router;
