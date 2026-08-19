// API Routes for Progress Notes
const express = require('express');
const router = express.Router();
const { DB_TYPE, firestore, pool } = require('../db');

// GET all progress notes
router.get('/', async (req, res) => {
  try {
    if (DB_TYPE === 'firebase' && firestore) {
      const notes = await firestore.listDocs('progress_notes', { orderBy: 'created_at', orderDirection: 'desc' });
      return res.json(notes);
    } else if (pool) {
      const [rows] = await pool.query('SELECT * FROM progress_notes ORDER BY created_at DESC');
      return res.json(rows);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET progress by doctor email
router.get('/doctor/:email', async (req, res) => {
  try {
    if (DB_TYPE === 'firebase' && firestore) {
      const notes = await firestore.findDocs('progress_notes', 'doctor_email', req.params.email, 'created_at', 'desc');
      return res.json(notes);
    } else if (pool) {
      const [rows] = await pool.query('SELECT * FROM progress_notes WHERE doctor_email = ? ORDER BY created_at DESC', [req.params.email]);
      return res.json(rows);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create progress note
router.post('/', async (req, res) => {
  try {
    const { doctor_id, doctorId, doctor_email, doctorEmail, notes } = req.body;
    const docId = doctor_id || doctorId || '';
    const docEmail = doctor_email || doctorEmail || '';

    if (DB_TYPE === 'firebase' && firestore) {
      const newNote = await firestore.createDoc('progress_notes', {
        doctor_id: docId,
        doctorId: docId,
        doctor_email: docEmail,
        doctorEmail: docEmail,
        notes: notes || ''
      });
      return res.status(201).json({ id: newNote.id, message: 'Progress note created' });
    } else if (pool) {
      const [result] = await pool.query(
        'INSERT INTO progress_notes (doctor_id, doctor_email, notes) VALUES (?, ?, ?)',
        [docId, docEmail, notes]
      );
      return res.status(201).json({ id: result.insertId, message: 'Progress note created' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
