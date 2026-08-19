const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { DB_TYPE, firestore, pool } = require('../db');
const { DEFAULT_ADMIN } = require('../utils/bootstrap');

const JWT_SECRET = process.env.JWT_SECRET || 'ayursutra_super_secret_key_2026';

// Set up Multer for file uploads (Degree & ID Proofs)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '..', '..', 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_'));
  }
});
const upload = multer({ storage: storage });

// ─── POST /api/auth/signup ───────────────────────────────────────────
router.post('/signup', upload.fields([{ name: 'degreeFile' }, { name: 'idProofFile' }]), async (req, res) => {
  try {
    const { name, email, password, role, licenseNumber } = req.body;
    const normalizedRole = role === 'doctor' || role === 'patient' ? role : 'patient';

    if (email === DEFAULT_ADMIN.email || normalizedRole === 'admin') {
      return res.status(403).json({ error: 'Admin signup is not allowed.' });
    }

    let degreeUrl = null;
    let idProofUrl = null;

    if (normalizedRole === 'doctor') {
      if (!req.files || !req.files.degreeFile || !req.files.idProofFile) {
        return res.status(400).json({ error: 'Doctor requires both Degree and ID Proof files' });
      }
      degreeUrl = '/uploads/' + req.files.degreeFile[0].filename;
      idProofUrl = '/uploads/' + req.files.idProofFile[0].filename;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    if (DB_TYPE === 'firebase' && firestore) {
      // Firebase Firestore Signup
      const existing = await firestore.findOneDoc('users', 'email', email);
      if (existing) {
        return res.status(400).json({ error: 'Email already exists' });
      }

      const newUser = await firestore.createDoc('users', {
        name,
        email,
        password: hashedPassword,
        role: normalizedRole,
        license_number: licenseNumber || null,
        degree_url: degreeUrl,
        id_proof_url: idProofUrl,
        approved: normalizedRole === 'doctor' ? false : true,
        blocked: false,
        flagged: false,
        rating: 0,
        total_ratings: 0,
        complaints: 0,
        total_requests: 0,
        rejected_requests: 0,
        rejection_rate: 0,
        total_sessions: 0
      });

      return res.status(201).json({ message: 'Signup successful', userId: newUser.id });
    } else if (pool) {
      // MySQL Signup
      const [existing] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
      if (existing.length > 0) return res.status(400).json({ error: 'Email already exists' });

      const [result] = await pool.query(
        `INSERT INTO users (name, email, password, role, license_number, degree_url, id_proof_url, approved, blocked) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, email, hashedPassword, normalizedRole, licenseNumber || null, degreeUrl, idProofUrl, normalizedRole === 'doctor' ? false : true, false]
      );

      return res.status(201).json({ message: 'Signup successful', userId: result.insertId });
    }
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─── POST /api/auth/login ────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    let user = null;

    if (DB_TYPE === 'firebase' && firestore) {
      user = await firestore.findOneDoc('users', 'email', email);
    } else if (pool) {
      const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
      if (rows.length > 0) user = rows[0];
    }

    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Role-specific guards
    if (user.role === 'doctor') {
      if (user.blocked) return res.status(403).json({ error: 'Your account has been suspended by the administrator.' });
      if (user.flagged) return res.status(403).json({ error: 'Your application has been rejected by the administrator.' });
      if (!user.approved) return res.status(403).json({ error: 'Your account is waiting for admin approval.' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

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
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
