// Database Connector for AyurSutra
// Supports both Firebase Cloud Firestore (default) and MySQL

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const DB_TYPE = (process.env.DB_TYPE || 'firebase').toLowerCase();

let firestore = null;
let pool = null;

if (DB_TYPE === 'mysql') {
  const mysql = require('mysql2/promise');
  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ayursutra_db',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
} else {
  firestore = require('./firestore');
}

async function testConnection() {
  if (DB_TYPE === 'mysql') {
    try {
      const connection = await pool.getConnection();
      console.log('✅ MySQL connected successfully to database:', process.env.DB_NAME);
      connection.release();
      return true;
    } catch (err) {
      console.error('❌ MySQL connection failed:', err.message);
      return false;
    }
  } else {
    return await firestore.testFirestoreConnection();
  }
}

module.exports = {
  DB_TYPE,
  firestore,
  pool,
  testConnection
};
