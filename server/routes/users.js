// API Routes for Users
const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// GET all users
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET user by email
router.get('/email/:email', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [req.params.email]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET users by role
router.get('/role/:role', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE role = ?', [req.params.role]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create user
router.post('/', async (req, res) => {
  try {
    const { uid, name, email, role, approved } = req.body;
    const [result] = await pool.query(
      'INSERT INTO users (uid, name, email, role, approved) VALUES (?, ?, ?, ?, ?)',
      [uid, name, email, role || 'patient', approved || false]
    );
    res.status(201).json({ id: result.insertId, message: 'User created' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update user
router.put('/:id', async (req, res) => {
  try {
    const fields = req.body;
    const setClauses = Object.keys(fields).map(key => `${key} = ?`).join(', ');
    const values = Object.values(fields);
    values.push(req.params.id);

    await pool.query(`UPDATE users SET ${setClauses} WHERE id = ?`, values);
    res.json({ message: 'User updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE user
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
