const bcrypt = require("bcryptjs");
const { pool } = require("../db");

const DEFAULT_ADMIN = {
  name: "Om Rahatal",
  email: "omrahatal@gmail.com",
  password: "omrahatal",
  role: "admin"
};

async function ensureDefaultAdmin() {
  const connection = await pool.getConnection();

  try {
    const [rows] = await connection.query(
      "SELECT id, email, role FROM users WHERE email = ? LIMIT 1",
      [DEFAULT_ADMIN.email]
    );

    const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN.password, 10);

    if (rows.length === 0) {
      await connection.query(
        "INSERT INTO users (name, email, password, role, approved, blocked, flagged) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [DEFAULT_ADMIN.name, DEFAULT_ADMIN.email, hashedPassword, DEFAULT_ADMIN.role, true, false, false]
      );
    } else {
      await connection.query(
        "UPDATE users SET name = ?, password = ?, role = ?, approved = 1, blocked = 0, flagged = 0 WHERE email = ?",
        [DEFAULT_ADMIN.name, hashedPassword, DEFAULT_ADMIN.role, DEFAULT_ADMIN.email]
      );
    }

    await connection.query(
      "UPDATE users SET role = 'patient' WHERE role = 'admin' AND email <> ?",
      [DEFAULT_ADMIN.email]
    );
  } finally {
    connection.release();
  }
}

module.exports = {
  ensureDefaultAdmin,
  DEFAULT_ADMIN
};
