const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { authenticateUser, requireRole } = require('../middleware/auth');
const { ALLOWED_CATEGORIES } = require('./categories');

/**
 * POST /api/requests
 * Customer submits a new service request
 */
router.post('/', authenticateUser, requireRole('CUSTOMER', 'ADMIN'), async (req, res) => {
  try {
    const { category_id, title, description, location, preferred_date } = req.body;
    const customer_id = req.user.id;

    if (!category_id || !title || !description || !location) {
      return res.status(400).json({
        error: 'Service category, title, description, and location are required.',
      });
    }

    // Validate that category_id is one of the 3 allowed categories
    const catCheck = await query(
      'SELECT id, name FROM service_categories WHERE id = $1 AND name = ANY($2)',
      [category_id, ALLOWED_CATEGORIES]
    );

    if (catCheck.rows.length === 0) {
      return res.status(400).json({
        error: `Invalid category. Only ${ALLOWED_CATEGORIES.join(', ')} are supported.`,
      });
    }

    // Automatically find available provider in this category with fewest active tasks
    const providerQuery = `
      SELECT 
        sp.id AS provider_id,
        sp.user_id,
        u.name AS provider_name,
        u.phone AS provider_phone,
        u.email AS provider_email,
        COUNT(CASE WHEN sr.status IN ('PENDING', 'ACCEPTED', 'ASSIGNED', 'IN_PROGRESS', 'Pending Customer Confirmation', 'PENDING_CUSTOMER_CONFIRMATION') AND a.completed_at IS NULL THEN 1 END) AS active_tasks
      FROM service_providers sp
      JOIN users u ON sp.user_id = u.id
      LEFT JOIN assignments a ON sp.id = a.provider_id
      LEFT JOIN service_requests sr ON a.request_id = sr.id
      WHERE sp.category_id = $1
      GROUP BY sp.id, sp.user_id, u.name, u.phone, u.email
      ORDER BY 
        (CASE WHEN sp.availability = true THEN 0 ELSE 1 END) ASC,
        active_tasks ASC,
        sp.id ASC
      LIMIT 1
    `;

    const providerResult = await query(providerQuery, [category_id]);
    const matchedProvider = providerResult.rows.length > 0 ? providerResult.rows[0] : null;

    // If an available provider is found, status is ASSIGNED, otherwise PENDING
    const initialStatus = matchedProvider ? 'ASSIGNED' : 'PENDING';

    const insertResult = await query(
      `INSERT INTO service_requests (customer_id, category_id, title, description, location, preferred_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [customer_id, category_id, title.trim(), description.trim(), location.trim(), preferred_date || null, initialStatus]
    );

    const newRequest = insertResult.rows[0];

    // Automatically insert assignment record if provider was matched
    if (matchedProvider) {
      await query(
        `INSERT INTO assignments (request_id, provider_id, assigned_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP)`,
        [newRequest.id, matchedProvider.provider_id]
      );
      newRequest.provider_id = matchedProvider.provider_id;
      newRequest.provider_name = matchedProvider.provider_name;
      newRequest.provider_phone = matchedProvider.provider_phone;
    }

    res.status(201).json({
      success: true,
      message: matchedProvider
        ? `Service request submitted and automatically assigned to ${matchedProvider.provider_name}!`
        : 'Service request submitted successfully!',
      request: newRequest,
    });
  } catch (error) {
    console.error('Error creating service request:', error);
    res.status(500).json({ error: 'Failed to create service request. ' + error.message });
  }
});

/**
 * GET /api/requests
 * List service requests based on user role & query parameters
 */
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { status, category_id } = req.query;
    const user = req.user;

    let baseQuery = `
      SELECT 
        sr.id,
        sr.customer_id,
        sr.category_id,
        sr.title,
        sr.description,
        sr.location,
        sr.preferred_date,
        sr.status,
        sr.created_at,
        sr.updated_at,
        sc.name AS category_name,
        sc.description AS category_description,
        cu.name AS customer_name,
        cu.email AS customer_email,
        cu.phone AS customer_phone,
        a.id AS assignment_id,
        a.provider_id,
        a.assigned_at,
        a.completed_at,
        pu.name AS provider_name,
        pu.phone AS provider_phone,
        pu.email AS provider_email,
        sp.location AS provider_location,
        r.id AS review_id,
        r.rating,
        r.comment AS review_comment,
        r.created_at AS review_created_at
      FROM service_requests sr
      JOIN service_categories sc ON sr.category_id = sc.id
      JOIN users cu ON sr.customer_id = cu.id
      LEFT JOIN assignments a ON sr.id = a.request_id
      LEFT JOIN service_providers sp ON a.provider_id = sp.id
      LEFT JOIN users pu ON sp.user_id = pu.id
      LEFT JOIN reviews r ON sr.id = r.request_id
      WHERE sc.name = ANY($1)
    `;

    const queryParams = [ALLOWED_CATEGORIES];
    let paramIndex = 2;

    // Role-based scoping
    if (user.role === 'CUSTOMER') {
      baseQuery += ` AND sr.customer_id = $${paramIndex++}`;
      queryParams.push(user.id);
    } else if (user.role === 'PROVIDER') {
      if (!user.provider) {
        return res.json({ success: true, requests: [] });
      }
      // Provider sees:
      // 1. Pending requests in their specific category
      // 2. Or requests assigned to them
      baseQuery += ` AND (
        (sr.category_id = $${paramIndex++} AND sr.status = 'PENDING')
        OR a.provider_id = $${paramIndex++}
      )`;
      queryParams.push(user.provider.category_id, user.provider.provider_id);
    }
    // ADMIN sees all

    // Optional filters
    if (status) {
      baseQuery += ` AND sr.status = $${paramIndex++}`;
      queryParams.push(status.toUpperCase());
    }

    if (category_id) {
      baseQuery += ` AND sr.category_id = $${paramIndex++}`;
      queryParams.push(parseInt(category_id, 10));
    }

    baseQuery += ` ORDER BY sr.created_at DESC`;

    const result = await query(baseQuery, queryParams);

    res.json({
      success: true,
      count: result.rows.length,
      requests: result.rows,
    });
  } catch (error) {
    console.error('Error fetching service requests:', error);
    res.status(500).json({ error: 'Failed to fetch service requests. ' + error.message });
  }
});

/**
 * GET /api/requests/:id
 * Single request details
 */
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const requestId = parseInt(req.params.id, 10);
    const result = await query(
      `SELECT 
        sr.*,
        sc.name AS category_name,
        cu.name AS customer_name,
        cu.email AS customer_email,
        cu.phone AS customer_phone,
        a.id AS assignment_id,
        a.provider_id,
        a.assigned_at,
        a.completed_at,
        pu.name AS provider_name,
        pu.phone AS provider_phone,
        r.id AS review_id,
        r.rating,
        r.comment AS review_comment
      FROM service_requests sr
      JOIN service_categories sc ON sr.category_id = sc.id
      JOIN users cu ON sr.customer_id = cu.id
      LEFT JOIN assignments a ON sr.id = a.request_id
      LEFT JOIN service_providers sp ON a.provider_id = sp.id
      LEFT JOIN users pu ON sp.user_id = pu.id
      LEFT JOIN reviews r ON sr.id = r.request_id
      WHERE sr.id = $1`,
      [requestId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Service request not found.' });
    }

    const requestData = result.rows[0];

    // Customer can only view their own requests, unless admin or provider
    if (req.user.role === 'CUSTOMER' && requestData.customer_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    res.json({
      success: true,
      request: requestData,
    });
  } catch (error) {
    console.error('Error fetching single request:', error);
    res.status(500).json({ error: 'Failed to retrieve request details.' });
  }
});

/**
 * PATCH /api/requests/:id/status
 * Provider or Admin updates the request status
 * Valid statuses: 'PENDING', 'ACCEPTED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'
 */
router.patch('/:id/status', authenticateUser, async (req, res) => {
  try {
    const requestId = parseInt(req.params.id, 10);
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required.' });
    }

    // Normalize status string
    let normalizedStatus = status.trim();
    if (
      normalizedStatus.toUpperCase() === 'PENDING_CUSTOMER_CONFIRMATION' ||
      normalizedStatus.toUpperCase() === 'PENDING CUSTOMER CONFIRMATION'
    ) {
      normalizedStatus = 'Pending Customer Confirmation';
    } else {
      normalizedStatus = normalizedStatus.toUpperCase();
    }

    const allowedStatuses = [
      'PENDING',
      'ACCEPTED',
      'ASSIGNED',
      'IN_PROGRESS',
      'Pending Customer Confirmation',
      'COMPLETED',
      'CANCELLED',
    ];

    if (!allowedStatuses.includes(normalizedStatus)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}`,
      });
    }

    // Check request existence
    const requestCheck = await query('SELECT * FROM service_requests WHERE id = $1', [requestId]);
    if (requestCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Service request not found.' });
    }

    const currentReq = requestCheck.rows[0];

    // Check permissions and workflow rules
    if (req.user.role === 'CUSTOMER') {
      if (normalizedStatus === 'CANCELLED') {
        if (currentReq.customer_id !== req.user.id || currentReq.status !== 'PENDING') {
          return res.status(403).json({ error: 'Customers can only cancel their own pending requests.' });
        }
      } else if (normalizedStatus === 'COMPLETED') {
        // Customer confirms completion!
        if (currentReq.customer_id !== req.user.id) {
          return res.status(403).json({ error: 'You can only confirm completion for your own service requests.' });
        }
        if (
          currentReq.status !== 'Pending Customer Confirmation' &&
          currentReq.status !== 'PENDING_CUSTOMER_CONFIRMATION'
        ) {
          return res.status(400).json({
            error: 'Request is not currently awaiting customer confirmation.',
          });
        }
      } else {
        return res.status(403).json({ error: 'Customers can only cancel pending requests or confirm completion.' });
      }
    } else if (req.user.role === 'PROVIDER') {
      // Providers CANNOT finalize a job directly to COMPLETED; change to 'Pending Customer Confirmation'
      if (normalizedStatus === 'COMPLETED') {
        normalizedStatus = 'Pending Customer Confirmation';
      }

      if (normalizedStatus === 'ACCEPTED' || normalizedStatus === 'IN_PROGRESS') {
        if (!req.user.provider) {
          return res.status(400).json({ error: 'User is not registered as a service provider.' });
        }

        if (req.user.provider.category_id !== currentReq.category_id) {
          return res.status(403).json({ error: 'You can only accept requests matching your service category.' });
        }

        const assignCheck = await query('SELECT id FROM assignments WHERE request_id = $1', [requestId]);
        if (assignCheck.rows.length === 0) {
          await query(
            'INSERT INTO assignments (request_id, provider_id) VALUES ($1, $2)',
            [requestId, req.user.provider.provider_id]
          );
        }
      }
    }

    // If status is COMPLETED, update assignment completed_at timestamp
    if (normalizedStatus === 'COMPLETED') {
      await query(
        `UPDATE assignments 
         SET completed_at = CURRENT_TIMESTAMP 
         WHERE request_id = $1 AND completed_at IS NULL`,
        [requestId]
      );
    }

    // Update service request status
    const updateResult = await query(
      `UPDATE service_requests 
       SET status = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *`,
      [normalizedStatus, requestId]
    );

    res.json({
      success: true,
      message: `Request status updated to ${normalizedStatus}`,
      request: updateResult.rows[0],
    });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ error: 'Failed to update request status. ' + error.message });
  }
});

/**
 * POST /api/requests/:id/assign
 * Admin or Provider assigns a technician to a request
 */
router.post('/:id/assign', authenticateUser, requireRole('ADMIN', 'PROVIDER'), async (req, res) => {
  try {
    const requestId = parseInt(req.params.id, 10);
    let providerId = req.body.provider_id;

    if (req.user.role === 'PROVIDER') {
      if (!req.user.provider) {
        return res.status(400).json({ error: 'Provider record missing.' });
      }
      providerId = req.user.provider.provider_id;
    }

    if (!providerId) {
      return res.status(400).json({ error: 'provider_id is required.' });
    }

    // Verify provider exists
    const providerCheck = await query(
      `SELECT sp.id, sp.category_id, u.name 
       FROM service_providers sp 
       JOIN users u ON sp.user_id = u.id 
       WHERE sp.id = $1`,
      [providerId]
    );

    if (providerCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Provider not found.' });
    }

    // Check request
    const reqCheck = await query('SELECT id, category_id, status FROM service_requests WHERE id = $1', [requestId]);
    if (reqCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Service request not found.' });
    }

    // Check if already assigned
    const assignCheck = await query('SELECT id FROM assignments WHERE request_id = $1', [requestId]);
    if (assignCheck.rows.length > 0) {
      await query(
        `UPDATE assignments 
         SET provider_id = $1, assigned_at = CURRENT_TIMESTAMP, completed_at = NULL 
         WHERE request_id = $2`,
        [providerId, requestId]
      );
    } else {
      await query(
        'INSERT INTO assignments (request_id, provider_id) VALUES ($1, $2)',
        [requestId, providerId]
      );
    }

    // Update status to ASSIGNED or ACCEPTED
    await query(
      `UPDATE service_requests 
       SET status = 'ASSIGNED', updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1`,
      [requestId]
    );

    res.json({
      success: true,
      message: `Request #${requestId} assigned to provider successfully.`,
    });
  } catch (error) {
    console.error('Error assigning request:', error);
    res.status(500).json({ error: 'Failed to assign provider. ' + error.message });
  }
});

module.exports = router;
