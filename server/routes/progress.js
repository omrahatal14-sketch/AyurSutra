const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// GET all progress notes
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM progress_notes ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET progress by doctor email
router.get('/doctor/:email', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM progress_notes WHERE doctor_email = ? ORDER BY created_at DESC', [req.params.email]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create progress note
router.post('/', async (req, res) => {
  try {
    const { doctor_id, doctor_email, notes } = req.body;
    const [result] = await pool.query(
      'INSERT INTO progress_notes (doctor_id, doctor_email, notes) VALUES (?, ?, ?)',
      [doctor_id, doctor_email, notes]
    );
    res.status(201).json({ id: result.insertId, message: 'Progress note created' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
