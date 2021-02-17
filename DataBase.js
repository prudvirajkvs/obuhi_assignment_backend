const { Pool } = require('pg');

const pool = new Pool({
  host: 'localHost',
  port: 5432,
  user: 'postgres',
  password: '1234',
  database: 'postgres',
});

module.exports = pool;
