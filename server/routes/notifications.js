// API Routes for Notifications
const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// GET all notifications
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM notifications ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET notifications for a specific user email (or "All Patients")
router.get('/user/:email', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM notifications WHERE to_email = ? OR to_email = ? ORDER BY created_at DESC',
      [req.params.email, 'All Patients']
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create notification
router.post('/', async (req, res) => {
  try {
    const { to_email, message } = req.body;
    const [result] = await pool.query(
      'INSERT INTO notifications (to_email, message) VALUES (?, ?)',
      [to_email, message]
    );
    res.status(201).json({ id: result.insertId, message: 'Notification sent' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE notification
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM notifications WHERE id = ?', [req.params.id]);
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
