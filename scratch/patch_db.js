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

  const [columns] = await connection.query('SHOW COLUMNS FROM sessions');
  const existingCols = columns.map(c => c.Field);
  console.log('Existing columns:', existingCols);

  const queries = [
    'ALTER TABLE sessions ADD COLUMN total_fee DECIMAL(10,2) DEFAULT 0.00;',
    'ALTER TABLE sessions ADD COLUMN advance_fee DECIMAL(10,2) DEFAULT 0.00;',
    'ALTER TABLE sessions ADD COLUMN remaining_fee DECIMAL(10,2) DEFAULT 0.00;',
    'ALTER TABLE sessions ADD COLUMN advance_paid BOOLEAN DEFAULT FALSE;',
    'ALTER TABLE sessions ADD COLUMN remaining_paid BOOLEAN DEFAULT FALSE;',
    'ALTER TABLE sessions ADD COLUMN payment_status VARCHAR(50) DEFAULT "advance_due";',
    'ALTER TABLE sessions ADD COLUMN razorpay_order_id VARCHAR(255);',
    'ALTER TABLE sessions ADD COLUMN razorpay_payment_id VARCHAR(255);',
    'ALTER TABLE sessions ADD COLUMN razorpay_signature VARCHAR(255);',
    'ALTER TABLE sessions ADD COLUMN remaining_order_id VARCHAR(255);',
    'ALTER TABLE sessions ADD COLUMN remaining_payment_id VARCHAR(255);',
    'ALTER TABLE sessions ADD COLUMN offline_remaining_paid BOOLEAN DEFAULT FALSE;',
    'ALTER TABLE sessions ADD COLUMN platform_revenue DECIMAL(10,2) DEFAULT 0.00;'
  ];

  for (const query of queries) {
    const colNameMatch = query.match(/ADD COLUMN\s+(\w+)/i);
    if (colNameMatch) {
      const colName = colNameMatch[1];
      if (!existingCols.includes(colName)) {
        console.log(`Adding column ${colName}...`);
        try {
          await connection.query(query);
          console.log(`Success: added ${colName}`);
        } catch (e) {
          console.error(`Failed to add ${colName}:`, e.message);
        }
      } else {
        console.log(`Column ${colName} already exists, skipping.`);
      }
    }
  }

  console.log("Database schema patched successfully.");
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
