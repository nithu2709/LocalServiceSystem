const { Pool } = require('pg');
require('dotenv').config();

// Initialize PostgreSQL Connection Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20, // maximum connection pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});

// Helper query function for clean error handling and logging
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[DB Query] executed in ${duration}ms, rows: ${res.rowCount}`);
    }
    return res;
  } catch (error) {
    console.error(`[DB Error] in query: ${text}`, error.message);
    throw error;
  }
};

module.exports = {
  pool,
  query,
};
