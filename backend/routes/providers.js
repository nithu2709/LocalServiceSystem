const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { authenticateUser, requireRole } = require('../middleware/auth');
const { ALLOWED_CATEGORIES } = require('./categories');

/**
 * GET /api/providers
 * List all providers with specialty, availability, and rating
 */
router.get('/', async (req, res) => {
  try {
    const { category_id } = req.query;

    let sql = `
      SELECT 
        sp.id AS provider_id,
        sp.user_id,
        sp.category_id,
        sp.experience,
        sp.availability,
        sp.location,
        u.name,
        u.email,
        u.phone,
        sc.name AS category_name,
        COALESCE(ROUND(AVG(r.rating)::numeric, 1), 5.0) AS avg_rating,
        COUNT(DISTINCT r.id) AS review_count,
        COUNT(DISTINCT CASE WHEN a.completed_at IS NOT NULL THEN a.id END) AS completed_jobs
      FROM service_providers sp
      JOIN users u ON sp.user_id = u.id
      JOIN service_categories sc ON sp.category_id = sc.id
      LEFT JOIN assignments a ON sp.id = a.provider_id
      LEFT JOIN reviews r ON sp.id = r.provider_id
      WHERE sc.name = ANY($1)
    `;

    const params = [ALLOWED_CATEGORIES];
    if (category_id) {
      sql += ` AND sp.category_id = $2`;
      params.push(parseInt(category_id, 10));
    }

    sql += ` GROUP BY sp.id, u.id, sc.id ORDER BY sp.id ASC`;

    const result = await query(sql, params);

    res.json({
      success: true,
      count: result.rows.length,
      providers: result.rows,
    });
  } catch (error) {
    console.error('Error fetching providers:', error);
    res.status(500).json({ error: 'Failed to fetch providers.' });
  }
});

/**
 * PATCH /api/providers/availability
 * Provider updates their availability status
 */
router.patch('/availability', authenticateUser, requireRole('PROVIDER'), async (req, res) => {
  try {
    const { availability } = req.body;
    if (typeof availability !== 'boolean') {
      return res.status(400).json({ error: 'Availability must be a boolean.' });
    }

    if (!req.user.provider) {
      return res.status(400).json({ error: 'No provider profile found for this user.' });
    }

    const updateRes = await query(
      `UPDATE service_providers 
       SET availability = $1 
       WHERE id = $2 
       RETURNING id, availability`,
      [availability, req.user.provider.provider_id]
    );

    res.json({
      success: true,
      message: `Availability updated to ${availability ? 'Available' : 'Busy'}`,
      provider: updateRes.rows[0],
    });
  } catch (error) {
    console.error('Error updating availability:', error);
    res.status(500).json({ error: 'Failed to update availability.' });
  }
});

module.exports = router;
