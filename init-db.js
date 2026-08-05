const fs = require('fs');
const path = require('path');
require('dotenv').config();
const mysql = require('mysql2/promise');

async function runSchema() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    multipleStatements: true
  });

  try {
    const schemaSql = fs.readFileSync(path.join(__dirname, 'server', 'schema.sql'), 'utf8');
    await connection.query('DROP DATABASE IF EXISTS ayursutra_db;');
    await connection.query(schemaSql);
    console.log('Database initialized successfully from schema.sql');
  } catch (err) {
    console.error('Error running schema.sql:', err);
  } finally {
    await connection.end();
  }
}

runSchema();
