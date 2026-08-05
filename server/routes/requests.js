// API Routes for Requests (therapy session requests)
const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// GET all requests
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM requests ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET requests by doctor email
router.get('/doctor/:email', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM requests WHERE doctor_email = ? ORDER BY created_at DESC', [req.params.email]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET requests by patient email
router.get('/patient/:email', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM requests WHERE patient_email = ? ORDER BY created_at DESC', [req.params.email]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create request
router.post('/', async (req, res) => {
  try {
    const { patient_email, doctor_email, therapy, date, time } = req.body;
    const [result] = await pool.query(
      'INSERT INTO requests (patient_email, doctor_email, therapy, date, time) VALUES (?, ?, ?, ?, ?)',
      [patient_email, doctor_email, therapy, date, time]
    );
    res.status(201).json({ id: result.insertId, message: 'Request created' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update request (accept/reject)
router.put('/:id', async (req, res) => {
  try {
    const fields = req.body;
    const setClauses = Object.keys(fields).map(key => `${key} = ?`).join(', ');
    const values = Object.values(fields);
    values.push(req.params.id);

    await pool.query(`UPDATE requests SET ${setClauses} WHERE id = ?`, values);
    res.json({ message: 'Request updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE request
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM requests WHERE id = ?', [req.params.id]);
    res.json({ message: 'Request deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
