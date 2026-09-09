const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { authenticateUser, requireRole } = require('../middleware/auth');
const { ALLOWED_CATEGORIES } = require('./categories');

/**
 * GET /api/admin/stats
 * Aggregate dashboard statistics
 */
router.get('/stats', authenticateUser, requireRole('ADMIN'), async (req, res) => {
  try {
    // Request status counts
    const statusCountsRes = await query(`
      SELECT 
        COUNT(*) AS total_requests,
        COUNT(CASE WHEN status = 'PENDING' THEN 1 END) AS pending_requests,
        COUNT(CASE WHEN status IN ('ACCEPTED', 'ASSIGNED', 'IN_PROGRESS') THEN 1 END) AS active_requests,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) AS completed_requests,
        COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) AS cancelled_requests
      FROM service_requests sr
      JOIN service_categories sc ON sr.category_id = sc.id
      WHERE sc.name = ANY($1)
    `, [ALLOWED_CATEGORIES]);

    // User counts
    const userCountsRes = await query(`
      SELECT 
        COUNT(CASE WHEN role = 'CUSTOMER' THEN 1 END) AS total_customers,
        COUNT(CASE WHEN role = 'PROVIDER' THEN 1 END) AS total_providers
      FROM users
    `);

    // System rating
    const ratingRes = await query(`
      SELECT 
        COALESCE(ROUND(AVG(rating)::numeric, 1), 5.0) AS avg_rating,
        COUNT(*) AS total_reviews
      FROM reviews
    `);

    // Category breakdown
    const categoryBreakdownRes = await query(`
      SELECT 
        sc.id,
        sc.name,
        COUNT(sr.id) AS total_requests,
        COUNT(CASE WHEN sr.status = 'COMPLETED' THEN 1 END) AS completed_count
      FROM service_categories sc
      LEFT JOIN service_requests sr ON sc.id = sr.category_id
      WHERE sc.name = ANY($1)
      GROUP BY sc.id, sc.name
      ORDER BY sc.id ASC
    `, [ALLOWED_CATEGORIES]);

    res.json({
      success: true,
      stats: {
        ...statusCountsRes.rows[0],
        ...userCountsRes.rows[0],
        ...ratingRes.rows[0],
        categories: categoryBreakdownRes.rows,
      },
    });
  } catch (error) {
    console.error('Error calculating admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch admin stats.' });
  }
});

/**
 * GET /api/admin/activity
 * Recent activity events feed
 */
router.get('/activity', authenticateUser, requireRole('ADMIN'), async (req, res) => {
  try {
    const recentRequests = await query(`
      SELECT 
        sr.id,
        sr.title,
        sr.status,
        sr.created_at,
        sc.name AS category_name,
        cu.name AS customer_name,
        pu.name AS provider_name
      FROM service_requests sr
      JOIN service_categories sc ON sr.category_id = sc.id
      JOIN users cu ON sr.customer_id = cu.id
      LEFT JOIN assignments a ON sr.id = a.request_id
      LEFT JOIN service_providers sp ON a.provider_id = sp.id
      LEFT JOIN users pu ON sp.user_id = pu.id
      WHERE sc.name = ANY($1)
      ORDER BY sr.updated_at DESC, sr.created_at DESC
      LIMIT 15
    `, [ALLOWED_CATEGORIES]);

    const recentReviews = await query(`
      SELECT 
        r.id,
        r.rating,
        r.comment,
        r.created_at,
        cu.name AS customer_name,
        pu.name AS provider_name,
        sr.title AS request_title
      FROM reviews r
      JOIN users cu ON r.customer_id = cu.id
      JOIN service_providers sp ON r.provider_id = sp.id
      JOIN users pu ON sp.user_id = pu.id
      JOIN service_requests sr ON r.request_id = sr.id
      ORDER BY r.created_at DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      activity: {
        recent_requests: recentRequests.rows,
        recent_reviews: recentReviews.rows,
      },
    });
  } catch (error) {
    console.error('Error fetching admin activity:', error);
    res.status(500).json({ error: 'Failed to fetch activity feed.' });
  }
});

/**
 * GET /api/admin/users
 * List all registered users
 */
router.get('/users', authenticateUser, requireRole('ADMIN'), async (req, res) => {
  try {
    const usersRes = await query(`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.phone, 
        u.role, 
        u.created_at,
        sp.id AS provider_id,
        sc.name AS provider_category
      FROM users u
      LEFT JOIN service_providers sp ON u.id = sp.user_id
      LEFT JOIN service_categories sc ON sp.category_id = sc.id
      ORDER BY u.created_at DESC
    `);

    res.json({
      success: true,
      users: usersRes.rows,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

module.exports = router;
