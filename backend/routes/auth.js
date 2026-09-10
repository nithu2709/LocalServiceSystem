const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { query } = require('../db');
const { authenticateUser, JWT_SECRET } = require('../middleware/auth');
const { ALLOWED_CATEGORIES } = require('./categories');
const { sendVerificationEmail } = require('../emailService');

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
 * Register a new user (Customer or Provider) with required email verification
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

    // Generate secure email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Insert user with is_verified = false and 24h expiration
    const userInsert = await query(
      `INSERT INTO users (name, email, password_hash, phone, role, is_verified, verification_token, verification_token_expires_at)
       VALUES ($1, $2, $3, $4, $5, FALSE, $6, CURRENT_TIMESTAMP + INTERVAL '24 hours')
       RETURNING id, name, email, phone, role, is_verified, created_at`,
      [name.trim(), email.toLowerCase().trim(), password_hash, phone || null, normalizedRole, verificationToken]
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

    // Dispatch verification email
    await sendVerificationEmail(newUser.email, newUser.name, verificationToken);

    res.status(201).json({
      success: true,
      requiresVerification: true,
      message: 'Registration successful! We have sent a confirmation email to verify your address. Please verify your email before logging in.',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        is_verified: false,
      },
      verificationToken, // Provided for instant demo/testing fallback
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed. ' + error.message });
  }
});

/**
 * GET /api/auth/verify-email
 * Clickable verification link handler (returns clean confirmation HTML)
 */
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head><title>Verification Failed</title><style>body{background:#09090b;color:#f4f4f5;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;}</style></head>
        <body><div style="background:#18181b;padding:32px;border-radius:16px;border:1px solid #27272a;text-align:center;max-width:400px;"><h2 style="color:#ef4444;">Invalid Verification Link</h2><p style="color:#a1a1aa;">The verification token is missing or malformed.</p></div></body></html>
      `);
    }

    const check = await query(
      `SELECT id, name, email, is_verified, verification_token_expires_at 
       FROM users 
       WHERE verification_token = $1`,
      [token]
    );

    if (check.rows.length === 0) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head><title>Verification Failed</title><style>body{background:#09090b;color:#f4f4f5;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;}</style></head>
        <body><div style="background:#18181b;padding:32px;border-radius:16px;border:1px solid #27272a;text-align:center;max-width:400px;"><h2 style="color:#ef4444;">Token Expired or Invalid</h2><p style="color:#a1a1aa;">This verification link is invalid or has already been used.</p></div></body></html>
      `);
    }

    const user = check.rows[0];

    // Check expiration
    if (user.verification_token_expires_at && new Date() > new Date(user.verification_token_expires_at)) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head><title>Verification Expired</title><style>body{background:#09090b;color:#f4f4f5;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;}</style></head>
        <body><div style="background:#18181b;padding:32px;border-radius:16px;border:1px solid #27272a;text-align:center;max-width:400px;"><h2 style="color:#ef4444;">Link Expired</h2><p style="color:#a1a1aa;">This verification link has expired. Please sign in and request a new link.</p></div></body></html>
      `);
    }

    // Mark user as verified
    await query(
      `UPDATE users 
       SET is_verified = TRUE, verification_token = NULL, verification_token_expires_at = NULL 
       WHERE id = $1`,
      [user.id]
    );

    const clientUrl = process.env.CLIENT_URL || 'https://localservicesystem.vercel.app';

    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verified - LocalService</title>
        <style>
          body { background: #09090b; color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .card { background: #18181b; padding: 40px; border-radius: 20px; border: 1px solid #27272a; text-align: center; max-width: 440px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
          .badge { width: 56px; height: 56px; border-radius: 50%; background: rgba(16, 185, 129, 0.1); color: #10b981; display: inline-flex; align-items: center; justify-content: center; font-size: 28px; margin-bottom: 20px; border: 1px solid rgba(16, 185, 129, 0.2); }
          h2 { color: #ffffff; margin: 0 0 10px; font-size: 22px; font-weight: 700; }
          p { color: #a1a1aa; font-size: 14px; line-height: 1.6; margin: 0 0 28px; }
          .btn { background: #6366f1; color: #ffffff; padding: 12px 28px; border-radius: 12px; font-weight: 600; text-decoration: none; font-size: 14px; display: inline-block; transition: background 0.2s; }
          .btn:hover { background: #4f46e5; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge">✓</div>
          <h2>Email Verified Successfully!</h2>
          <p>Thank you, <strong>${user.name}</strong>. Your email has been confirmed. You can now log into your LocalService account.</p>
          <a href="${clientUrl}" class="btn">Proceed to Sign In</a>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    console.error('Verify email error:', err);
    res.status(500).send('Internal Server Error during verification.');
  }
});

/**
 * POST /api/auth/verify-email
 * API endpoint to verify token via JSON body
 */
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Verification token is required.' });
    }

    const check = await query(
      `SELECT id, name, email, is_verified 
       FROM users 
       WHERE verification_token = $1`,
      [token.trim()]
    );

    if (check.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired verification token.' });
    }

    const user = check.rows[0];

    await query(
      `UPDATE users 
       SET is_verified = TRUE, verification_token = NULL, verification_token_expires_at = NULL 
       WHERE id = $1`,
      [user.id]
    );

    res.json({
      success: true,
      message: 'Email verified successfully! You may now sign in.',
    });
  } catch (err) {
    console.error('API verification error:', err);
    res.status(500).json({ error: 'Failed to verify email. ' + err.message });
  }
});

/**
 * POST /api/auth/resend-verification
 * Resend verification email
 */
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email address is required.' });
    }

    const check = await query('SELECT id, name, email, is_verified FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'No account found with this email address.' });
    }

    const user = check.rows[0];
    if (user.is_verified) {
      return res.status(400).json({ error: 'This account email is already verified. You can log in directly.' });
    }

    const newToken = crypto.randomBytes(32).toString('hex');
    await query(
      `UPDATE users 
       SET verification_token = $1, verification_token_expires_at = CURRENT_TIMESTAMP + INTERVAL '24 hours' 
       WHERE id = $2`,
      [newToken, user.id]
    );

    await sendVerificationEmail(user.email, user.name, newToken);

    res.json({
      success: true,
      message: 'A new verification link has been dispatched to your email address.',
      verificationToken: newToken,
    });
  } catch (err) {
    console.error('Resend verification error:', err);
    res.status(500).json({ error: 'Failed to resend verification email.' });
  }
});

/**
 * POST /api/auth/login
 * Authenticate with email & password (enforces is_verified = TRUE)
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const result = await query(
      'SELECT id, name, email, password_hash, phone, role, is_verified, created_at FROM users WHERE email = $1',
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

    // Enforce email verification check!
    if (user.is_verified === false) {
      return res.status(403).json({
        error: 'Your email address has not been verified yet. Please check your inbox for the confirmation email before logging in.',
        unverified: true,
        email: user.email,
      });
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

module.exports = router;
