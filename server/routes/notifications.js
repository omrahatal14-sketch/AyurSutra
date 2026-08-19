// API Routes for Notifications
const express = require('express');
const router = express.Router();
const { DB_TYPE, firestore, pool } = require('../db');

// GET all notifications
router.get('/', async (req, res) => {
  try {
    if (DB_TYPE === 'firebase' && firestore) {
      const notifications = await firestore.listDocs('notifications', { orderBy: 'created_at', orderDirection: 'desc' });
      return res.json(notifications);
    } else if (pool) {
      const [rows] = await pool.query('SELECT * FROM notifications ORDER BY created_at DESC');
      return res.json(rows);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET notifications for a specific user email (or "All Patients")
router.get('/user/:email', async (req, res) => {
  try {
    const targetEmail = req.params.email;
    if (DB_TYPE === 'firebase' && firestore) {
      const all = await firestore.listDocs('notifications', { orderBy: 'created_at', orderDirection: 'desc' });
      const filtered = all.filter(n => n.to_email === targetEmail || n.toEmail === targetEmail || n.to_email === 'All Patients' || n.toEmail === 'All Patients');
      return res.json(filtered);
    } else if (pool) {
      const [rows] = await pool.query(
        'SELECT * FROM notifications WHERE to_email = ? OR to_email = ? ORDER BY created_at DESC',
        [targetEmail, 'All Patients']
      );
      return res.json(rows);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create notification
router.post('/', async (req, res) => {
  try {
    const { to_email, toEmail, message } = req.body;
    const recipient = to_email || toEmail || 'All Patients';
    if (DB_TYPE === 'firebase' && firestore) {
      const newNotification = await firestore.createDoc('notifications', {
        to_email: recipient,
        toEmail: recipient,
        message: message || ''
      });
      return res.status(201).json({ id: newNotification.id, message: 'Notification sent' });
    } else if (pool) {
      const [result] = await pool.query(
        'INSERT INTO notifications (to_email, message) VALUES (?, ?)',
        [recipient, message]
      );
      return res.status(201).json({ id: result.insertId, message: 'Notification sent' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE notification
router.delete('/:id', async (req, res) => {
  try {
    if (DB_TYPE === 'firebase' && firestore) {
      await firestore.deleteDocById('notifications', req.params.id);
      return res.json({ message: 'Notification deleted' });
    } else if (pool) {
      await pool.query('DELETE FROM notifications WHERE id = ?', [req.params.id]);
      return res.json({ message: 'Notification deleted' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
