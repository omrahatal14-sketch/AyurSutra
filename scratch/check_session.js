const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'ayursutra_db',
    port: process.env.DB_PORT || 3306
  });

  const [rows] = await connection.query('SELECT * FROM sessions WHERE id = 2');
  console.log("Session data:", rows[0]);
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
