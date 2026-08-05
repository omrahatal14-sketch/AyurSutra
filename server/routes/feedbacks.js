// API Routes for Feedbacks
const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// GET all feedbacks
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM feedbacks ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET feedbacks by doctor email
router.get('/doctor/:email', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM feedbacks WHERE doctor_email = ? ORDER BY created_at DESC', [req.params.email]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET feedbacks by patient email
router.get('/patient/:email', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM feedbacks WHERE patient_email = ? ORDER BY created_at DESC', [req.params.email]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create feedback
router.post('/', async (req, res) => {
  try {
    const { patient_email, doctor_email, pain, energy, satisfaction, notes, reported } = req.body;
    const [result] = await pool.query(
      'INSERT INTO feedbacks (patient_email, doctor_email, pain, energy, satisfaction, notes, reported) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [patient_email, doctor_email, pain, energy, satisfaction, notes, reported || false]
    );
    res.status(201).json({ id: result.insertId, message: 'Feedback submitted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE feedback
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM feedbacks WHERE id = ?', [req.params.id]);
    res.json({ message: 'Feedback deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
