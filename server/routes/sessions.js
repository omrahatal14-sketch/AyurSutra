// API Routes for Sessions
const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// GET all sessions
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM sessions ORDER BY date DESC, time DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET sessions by doctor email
router.get('/doctor/:email', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM sessions WHERE doctor_email = ? ORDER BY date DESC', [req.params.email]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET sessions by patient email
router.get('/patient/:email', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM sessions WHERE patient_email = ? ORDER BY date DESC', [req.params.email]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create session
router.post('/', async (req, res) => {
  try {
    const { patient_email, doctor_email, type, date, time, room, status } = req.body;
    const [result] = await pool.query(
      'INSERT INTO sessions (patient_email, doctor_email, type, date, time, room, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [patient_email, doctor_email, type, date, time, room, status || 'scheduled']
    );
    res.status(201).json({ id: result.insertId, message: 'Session created' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update session
router.put('/:id', async (req, res) => {
  try {
    const fields = req.body;
    const setClauses = Object.keys(fields).map(key => `${key} = ?`).join(', ');
    const values = Object.values(fields);
    values.push(req.params.id);

    await pool.query(`UPDATE sessions SET ${setClauses} WHERE id = ?`, values);
    res.json({ message: 'Session updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE session
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM sessions WHERE id = ?', [req.params.id]);
    res.json({ message: 'Session deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
