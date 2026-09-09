const express = require('express');
const router = express.Router();
const { query } = require('../db');

// Strictly restricted to exactly 3 categories
const ALLOWED_CATEGORIES = ['Electrician', 'Plumber', 'AC Repair'];

/**
 * GET /api/categories
 * Returns strictly the 3 allowed service categories
 */
router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT id, name, description 
       FROM service_categories 
       WHERE name = ANY($1)
       ORDER BY id ASC`,
      [ALLOWED_CATEGORIES]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch service categories' });
  }
});

module.exports = {
  router,
  ALLOWED_CATEGORIES,
};
