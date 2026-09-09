const bcrypt = require('bcryptjs');
const { pool, query } = require('./db');

async function seed() {
  console.log('🌱 Starting database seeding for Local Service Management System...');

  try {
    // 1. Ensure the 3 restricted categories exist
    const categories = [
      { name: 'Electrician', description: 'Electrical repairs, wiring, and circuit breaker fixes' },
      { name: 'Plumber', description: 'Pipe fittings, leak repairs, and plumbing installations' },
      { name: 'AC Repair', description: 'Air conditioning servicing, filter replacement, and coolant refill' }
    ];

    const categoryMap = {};

    for (const cat of categories) {
      const existing = await query('SELECT id, name FROM service_categories WHERE name = $1', [cat.name]);
      if (existing.rows.length > 0) {
        categoryMap[cat.name] = existing.rows[0].id;
      } else {
        const inserted = await query(
          'INSERT INTO service_categories (name, description) VALUES ($1, $2) RETURNING id, name',
          [cat.name, cat.description]
        );
        categoryMap[cat.name] = inserted.rows[0].id;
      }
    }
    console.log('✅ Service categories verified:', categoryMap);

    // 2. Hash default password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    // 3. Insert Demo Users
    const demoUsers = [
      { name: 'Alex Customer', email: 'customer@demo.com', phone: '+1 (555) 123-4567', role: 'CUSTOMER' },
      { name: 'David Miller', email: 'electrician@demo.com', phone: '+1 (555) 234-5678', role: 'PROVIDER', category: 'Electrician', exp: '6 years licensed residential electrician', loc: 'Downtown & Metro' },
      { name: 'Sam Vance', email: 'plumber@demo.com', phone: '+1 (555) 345-6789', role: 'PROVIDER', category: 'Plumber', exp: '8 years commercial & residential plumbing', loc: 'Westside & Suburbs' },
      { name: 'Kevin Frost', email: 'ac_tech@demo.com', phone: '+1 (555) 456-7890', role: 'PROVIDER', category: 'AC Repair', exp: '5 years HVAC certified specialist', loc: 'North District' },
      { name: 'Sarah Connor', email: 'admin@demo.com', phone: '+1 (555) 999-0000', role: 'ADMIN' },
    ];

    const userMap = {};
    const providerMap = {};

    for (const u of demoUsers) {
      let userId;
      const existingUser = await query('SELECT id, role FROM users WHERE email = $1', [u.email]);
      if (existingUser.rows.length > 0) {
        userId = existingUser.rows[0].id;
        // update password to ensure login works
        await query('UPDATE users SET password_hash = $1, name = $2, phone = $3 WHERE id = $4', [passwordHash, u.name, u.phone, userId]);
      } else {
        const insertedUser = await query(
          'INSERT INTO users (name, email, password_hash, phone, role) VALUES ($1, $2, $3, $4, $5) RETURNING id',
          [u.name, u.email, passwordHash, u.phone, u.role]
        );
        userId = insertedUser.rows[0].id;
      }
      userMap[u.email] = userId;

      // If provider, ensure service_providers record
      if (u.role === 'PROVIDER') {
        const catId = categoryMap[u.category];
        const existingSp = await query('SELECT id FROM service_providers WHERE user_id = $1', [userId]);
        if (existingSp.rows.length > 0) {
          providerMap[u.category] = existingSp.rows[0].id;
        } else {
          const insertedSp = await query(
            'INSERT INTO service_providers (user_id, category_id, experience, availability, location) VALUES ($1, $2, $3, true, $4) RETURNING id',
            [userId, catId, u.exp, u.loc]
          );
          providerMap[u.category] = insertedSp.rows[0].id;
        }
      }
    }
    console.log('✅ Demo users & providers created/synced');

    // 4. Check if sample requests already exist
    const reqCountRes = await query('SELECT count(*) FROM service_requests');
    const reqCount = parseInt(reqCountRes.rows[0].count, 10);

    if (reqCount === 0) {
      console.log('📦 Seeding initial realistic service requests...');

      const customerId = userMap['customer@demo.com'];

      // Request 1: PENDING (Electrician)
      const req1 = await query(
        `INSERT INTO service_requests (customer_id, category_id, title, description, location, preferred_date, status)
         VALUES ($1, $2, 'Tripping Kitchen Circuit Breaker', 'The main switch in the kitchen trips whenever both the microwave and oven are on.', '742 Evergreen Terrace, Apt 4B', CURRENT_DATE + INTERVAL '1 day', 'PENDING')
         RETURNING id`,
        [customerId, categoryMap['Electrician']]
      );

      // Request 2: IN_PROGRESS (Plumber - assigned to Sam Vance)
      const req2 = await query(
        `INSERT INTO service_requests (customer_id, category_id, title, description, location, preferred_date, status)
         VALUES ($1, $2, 'Bathroom Sink Pipe Leakage', 'Water is dripping steadily under the primary bathroom vanity cabinet.', '10880 Wilshire Blvd, Suite 1200', CURRENT_DATE, 'IN_PROGRESS')
         RETURNING id`,
        [customerId, categoryMap['Plumber']]
      );
      await query(
        `INSERT INTO assignments (request_id, provider_id, assigned_at) VALUES ($1, $2, CURRENT_TIMESTAMP - INTERVAL '2 hours')`,
        [req2.rows[0].id, providerMap['Plumber']]
      );

      // Request 3: COMPLETED (AC Repair - assigned to Kevin Frost with review)
      const req3 = await query(
        `INSERT INTO service_requests (customer_id, category_id, title, description, location, preferred_date, status)
         VALUES ($1, $2, 'AC Unit Making Buzzing Noise', 'Living room split AC unit makes a loud rattling and humming noise when cooling begins.', '350 5th Ave, Floor 14', CURRENT_DATE - INTERVAL '3 days', 'COMPLETED')
         RETURNING id`,
        [customerId, categoryMap['AC Repair']]
      );
      await query(
        `INSERT INTO assignments (request_id, provider_id, assigned_at, completed_at) VALUES ($1, $2, CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP - INTERVAL '2 days')`,
        [req3.rows[0].id, providerMap['AC Repair']]
      );
      await query(
        `INSERT INTO reviews (request_id, customer_id, provider_id, rating, comment)
         VALUES ($1, $2, $3, 5, 'Prompt arrival and fixed the loose fan motor bushing in under an hour. Great service!')`,
        [req3.rows[0].id, customerId, providerMap['AC Repair']]
      );

      console.log('✅ Initial requests, assignments, and sample review created!');
    } else {
      console.log(`ℹ️ Service requests already present (${reqCount} records). Skipping sample requests insertion.`);
    }

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('--------------------------------------------------');
    console.log('Available Demo Accounts (Password for all: password123):');
    console.log('  Customer:    customer@demo.com');
    console.log('  Electrician: electrician@demo.com');
    console.log('  Plumber:     plumber@demo.com');
    console.log('  AC Repair:   ac_tech@demo.com');
    console.log('  Admin:       admin@demo.com');
    console.log('--------------------------------------------------');
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run seeder if called directly
if (require.main === module) {
  seed();
}

module.exports = { seed };
