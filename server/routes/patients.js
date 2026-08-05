// API Routes for Patients
const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// GET all patients
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM patients ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET patient by id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM patients WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Patient not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create patient
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, age, therapy, status, join_date, last_visit } = req.body;
    const [result] = await pool.query(
      'INSERT INTO patients (name, email, phone, age, therapy, status, join_date, last_visit) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, email, phone, age, therapy, status || 'active', join_date, last_visit]
    );
    res.status(201).json({ id: result.insertId, message: 'Patient created' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update patient
router.put('/:id', async (req, res) => {
  try {
    const fields = req.body;
    const setClauses = Object.keys(fields).map(key => `${key} = ?`).join(', ');
    const values = Object.values(fields);
    values.push(req.params.id);

    await pool.query(`UPDATE patients SET ${setClauses} WHERE id = ?`, values);
    res.json({ message: 'Patient updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE patient
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM patients WHERE id = ?', [req.params.id]);
    res.json({ message: 'Patient deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
