const bcrypt = require("bcryptjs");
const { DB_TYPE, firestore, pool } = require("../db");

const DEFAULT_ADMIN = {
  name: "Om Rahatal",
  email: "omrahatal@gmail.com",
  password: "omrahatal",
  role: "admin"
};

async function ensureDefaultAdmin() {
  try {
    const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN.password, 10);

    if (DB_TYPE === "firebase" && firestore) {
      try {
        const existingAdmin = await firestore.findOneDoc("users", "email", DEFAULT_ADMIN.email);

        if (!existingAdmin) {
          await firestore.createDoc("users", {
            name: DEFAULT_ADMIN.name,
            email: DEFAULT_ADMIN.email,
            password: hashedPassword,
            role: DEFAULT_ADMIN.role,
            approved: true,
            blocked: false,
            flagged: false,
            rating: 5.0,
            total_ratings: 1,
            total_sessions: 0
          });
          console.log(`👑 Default admin created in Firestore: ${DEFAULT_ADMIN.email}`);
        } else {
          await firestore.updateDocById("users", existingAdmin.id, {
            name: DEFAULT_ADMIN.name,
            password: hashedPassword,
            role: DEFAULT_ADMIN.role,
            approved: true,
            blocked: false,
            flagged: false
          });
          console.log(`👑 Default admin verified in Firestore: ${DEFAULT_ADMIN.email}`);
        }
      } catch (fErr) {
        console.warn(`⚠️ Firestore admin bootstrap note: ${fErr.message}`);
        console.warn('   (Will automatically succeed once serviceAccountKey.json is configured)');
      }
    } else if (pool) {
      // MySQL implementation
      const connection = await pool.getConnection();
      try {
        const [rows] = await connection.query(
          "SELECT id, email, role FROM users WHERE email = ? LIMIT 1",
          [DEFAULT_ADMIN.email]
        );

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
  } catch (err) {
    console.error("⚠️ Failed to ensure default admin:", err.message);
  }
}

module.exports = {
  ensureDefaultAdmin,
  DEFAULT_ADMIN
};
