const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.POSTGRES_USER || 'salon_user',
  password: process.env.POSTGRES_PASSWORD || 'salon_password',
  host: process.env.POSTGRES_HOST || 'postgres',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'salon_db',
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

module.exports = pool;

