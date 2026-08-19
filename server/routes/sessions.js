// API Routes for Sessions
const express = require('express');
const router = express.Router();
const { DB_TYPE, firestore, pool } = require('../db');

// GET all sessions
router.get('/', async (req, res) => {
  try {
    if (DB_TYPE === 'firebase' && firestore) {
      const sessions = await firestore.listDocs('sessions', { orderBy: 'date', orderDirection: 'desc' });
      return res.json(sessions);
    } else if (pool) {
      const [rows] = await pool.query('SELECT * FROM sessions ORDER BY date DESC, time DESC');
      return res.json(rows);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET sessions by doctor email
router.get('/doctor/:email', async (req, res) => {
  try {
    if (DB_TYPE === 'firebase' && firestore) {
      const sessions = await firestore.findDocs('sessions', 'doctor_email', req.params.email, 'date', 'desc');
      return res.json(sessions);
    } else if (pool) {
      const [rows] = await pool.query('SELECT * FROM sessions WHERE doctor_email = ? ORDER BY date DESC', [req.params.email]);
      return res.json(rows);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET sessions by patient email
router.get('/patient/:email', async (req, res) => {
  try {
    if (DB_TYPE === 'firebase' && firestore) {
      const sessions = await firestore.findDocs('sessions', 'patient_email', req.params.email, 'date', 'desc');
      return res.json(sessions);
    } else if (pool) {
      const [rows] = await pool.query('SELECT * FROM sessions WHERE patient_email = ? ORDER BY date DESC', [req.params.email]);
      return res.json(rows);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create session
router.post('/', async (req, res) => {
  try {
    const {
      patient_email,
      doctor_email,
      type,
      date,
      time,
      room,
      status,
      total_fee,
      advance_fee,
      remaining_fee,
      payment_status
    } = req.body;

    if (DB_TYPE === 'firebase' && firestore) {
      const newSession = await firestore.createDoc('sessions', {
        patient_email: patient_email || '',
        doctor_email: doctor_email || '',
        type: type || '',
        date: date || '',
        time: time || '',
        room: room || '',
        status: status || 'scheduled',
        total_fee: total_fee ? Number(total_fee) : 0,
        advance_fee: advance_fee ? Number(advance_fee) : 0,
        remaining_fee: remaining_fee ? Number(remaining_fee) : 0,
        advance_paid: false,
        remaining_paid: false,
        offline_remaining_paid: false,
        payment_status: payment_status || 'advance_due',
        platform_revenue: 0
      });
      return res.status(201).json({ id: newSession.id, message: 'Session created' });
    } else if (pool) {
      const [result] = await pool.query(
        'INSERT INTO sessions (patient_email, doctor_email, type, date, time, room, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [patient_email, doctor_email, type, date, time, room, status || 'scheduled']
      );
      return res.status(201).json({ id: result.insertId, message: 'Session created' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update session
router.put('/:id', async (req, res) => {
  try {
    const fields = req.body;
    if (DB_TYPE === 'firebase' && firestore) {
      await firestore.updateDocById('sessions', req.params.id, fields);
      return res.json({ message: 'Session updated' });
    } else if (pool) {
      const setClauses = Object.keys(fields).map(key => `${key} = ?`).join(', ');
      const values = Object.values(fields);
      values.push(req.params.id);

      await pool.query(`UPDATE sessions SET ${setClauses} WHERE id = ?`, values);
      return res.json({ message: 'Session updated' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE session
router.delete('/:id', async (req, res) => {
  try {
    if (DB_TYPE === 'firebase' && firestore) {
      await firestore.deleteDocById('sessions', req.params.id);
      return res.json({ message: 'Session deleted' });
    } else if (pool) {
      await pool.query('DELETE FROM sessions WHERE id = ?', [req.params.id]);
      return res.json({ message: 'Session deleted' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
