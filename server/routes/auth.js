const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { pool } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'ayursutra_super_secret_key_2026';

// Set up Multer for file uploads (Degree & ID Proofs)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '..', '..', 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

const { DEFAULT_ADMIN } = require('../utils/bootstrap');

// ─── POST /api/auth/signup ───────────────────────────────────────────
router.post('/signup', upload.fields([{ name: 'degreeFile' }, { name: 'idProofFile' }]), async (req, res) => {
  try {
    const { name, email, password, role, licenseNumber } = req.body;
    const normalizedRole = role === 'doctor' || role === 'patient' ? role : 'patient';

    if (email === DEFAULT_ADMIN.email || normalizedRole === 'admin') {
      return res.status(403).json({ error: 'Admin signup is not allowed.' });
    }
    
    // Check if user already exists
    const [existing] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existing.length > 0) return res.status(400).json({ error: 'Email already exists' });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let degreeUrl = null;
    let idProofUrl = null;

    if (normalizedRole === 'doctor') {
      if (!req.files || !req.files.degreeFile || !req.files.idProofFile) {
        return res.status(400).json({ error: 'Doctor requires both Degree and ID Proof files' });
      }
      degreeUrl = '/uploads/' + req.files.degreeFile[0].filename;
      idProofUrl = '/uploads/' + req.files.idProofFile[0].filename;
    }

    // Insert user
    const [result] = await pool.query(
      `INSERT INTO users (name, email, password, role, license_number, degree_url, id_proof_url, approved, blocked) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, email, hashedPassword, normalizedRole, licenseNumber || null, degreeUrl, idProofUrl, false, false]
    );

    res.status(201).json({ message: 'Signup successful', userId: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── POST /api/auth/login ────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) return res.status(400).json({ error: 'Invalid email or password' });

    const user = rows[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid email or password' });

    // Role-specific guards
    if (user.role === 'doctor') {
      if (user.blocked) return res.status(403).json({ error: 'Your account has been suspended by the administrator.' });
      if (user.flagged) return res.status(403).json({ error: 'Your application has been rejected by the administrator.' });
      if (!user.approved) return res.status(403).json({ error: 'Your account is waiting for admin approval.' });
    }

    // Generate JWT
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
