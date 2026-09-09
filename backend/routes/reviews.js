const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { authenticateUser, requireRole } = require('../middleware/auth');

/**
 * POST /api/reviews
 * Customer submits a review for a completed service request
 */
router.post('/', authenticateUser, requireRole('CUSTOMER'), async (req, res) => {
  try {
    const { request_id, rating, comment } = req.body;
    const customer_id = req.user.id;

    if (!request_id || !rating) {
      return res.status(400).json({ error: 'request_id and rating are required.' });
    }

    const numericRating = parseInt(rating, 10);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5.' });
    }

    // Verify request
    const reqRes = await query('SELECT * FROM service_requests WHERE id = $1', [request_id]);
    if (reqRes.rows.length === 0) {
      return res.status(404).json({ error: 'Service request not found.' });
    }

    const serviceReq = reqRes.rows[0];
    if (serviceReq.customer_id !== customer_id) {
      return res.status(403).json({ error: 'You can only review your own service requests.' });
    }

    if (serviceReq.status !== 'COMPLETED') {
      return res.status(400).json({
        error: 'Reviews can only be submitted for COMPLETED service requests.',
      });
    }

    // Find assigned provider
    const assignRes = await query('SELECT provider_id FROM assignments WHERE request_id = $1', [request_id]);
    if (assignRes.rows.length === 0) {
      return res.status(400).json({ error: 'No service provider was assigned to this request.' });
    }

    const provider_id = assignRes.rows[0].provider_id;

    // Check if already reviewed
    const reviewCheck = await query('SELECT id FROM reviews WHERE request_id = $1', [request_id]);
    if (reviewCheck.rows.length > 0) {
      return res.status(400).json({ error: 'You have already submitted a review for this service request.' });
    }

    const insertResult = await query(
      `INSERT INTO reviews (request_id, customer_id, provider_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [request_id, customer_id, provider_id, numericRating, comment ? comment.trim() : null]
    );

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully!',
      review: insertResult.rows[0],
    });
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({ error: 'Failed to submit review. ' + error.message });
  }
});

/**
 * GET /api/reviews
 * Get reviews with optional provider_id filter
 */
router.get('/', async (req, res) => {
  try {
    const { provider_id, request_id } = req.query;

    let sql = `
      SELECT 
        r.id,
        r.request_id,
        r.rating,
        r.comment,
        r.created_at,
        cu.name AS customer_name,
        pu.name AS provider_name,
        sc.name AS category_name,
        sr.title AS request_title
      FROM reviews r
      JOIN users cu ON r.customer_id = cu.id
      JOIN service_providers sp ON r.provider_id = sp.id
      JOIN users pu ON sp.user_id = pu.id
      JOIN service_requests sr ON r.request_id = sr.id
      JOIN service_categories sc ON sr.category_id = sc.id
      WHERE 1=1
    `;

    const params = [];
    if (provider_id) {
      params.push(parseInt(provider_id, 10));
      sql += ` AND r.provider_id = $${params.length}`;
    }
    if (request_id) {
      params.push(parseInt(request_id, 10));
      sql += ` AND r.request_id = $${params.length}`;
    }

    sql += ` ORDER BY r.created_at DESC`;

    const result = await query(sql, params);

    res.json({
      success: true,
      count: result.rows.length,
      reviews: result.rows,
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews.' });
  }
});

module.exports = router;
