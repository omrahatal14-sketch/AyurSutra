// API Routes for Feedbacks
const express = require('express');
const router = express.Router();
const { DB_TYPE, firestore, pool } = require('../db');

// GET all feedbacks
router.get('/', async (req, res) => {
  try {
    if (DB_TYPE === 'firebase' && firestore) {
      const feedbacks = await firestore.listDocs('feedbacks', { orderBy: 'created_at', orderDirection: 'desc' });
      return res.json(feedbacks);
    } else if (pool) {
      const [rows] = await pool.query('SELECT * FROM feedbacks ORDER BY created_at DESC');
      return res.json(rows);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET feedbacks by doctor email
router.get('/doctor/:email', async (req, res) => {
  try {
    if (DB_TYPE === 'firebase' && firestore) {
      const feedbacks = await firestore.findDocs('feedbacks', 'doctor_email', req.params.email, 'created_at', 'desc');
      return res.json(feedbacks);
    } else if (pool) {
      const [rows] = await pool.query('SELECT * FROM feedbacks WHERE doctor_email = ? ORDER BY created_at DESC', [req.params.email]);
      return res.json(rows);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET feedbacks by patient email
router.get('/patient/:email', async (req, res) => {
  try {
    if (DB_TYPE === 'firebase' && firestore) {
      const feedbacks = await firestore.findDocs('feedbacks', 'patient_email', req.params.email, 'created_at', 'desc');
      return res.json(feedbacks);
    } else if (pool) {
      const [rows] = await pool.query('SELECT * FROM feedbacks WHERE patient_email = ? ORDER BY created_at DESC', [req.params.email]);
      return res.json(rows);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create feedback
router.post('/', async (req, res) => {
  try {
    const { patient_email, doctor_email, pain, energy, satisfaction, notes, reported } = req.body;
    if (DB_TYPE === 'firebase' && firestore) {
      const newFeedback = await firestore.createDoc('feedbacks', {
        patient_email: patient_email || '',
        doctor_email: doctor_email || '',
        pain: pain ? Number(pain) : 0,
        energy: energy ? Number(energy) : 0,
        satisfaction: satisfaction ? Number(satisfaction) : 0,
        notes: notes || '',
        reported: reported ?? false
      });
      return res.status(201).json({ id: newFeedback.id, message: 'Feedback submitted' });
    } else if (pool) {
      const [result] = await pool.query(
        'INSERT INTO feedbacks (patient_email, doctor_email, pain, energy, satisfaction, notes, reported) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [patient_email, doctor_email, pain, energy, satisfaction, notes, reported || false]
      );
      return res.status(201).json({ id: result.insertId, message: 'Feedback submitted' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE feedback
router.delete('/:id', async (req, res) => {
  try {
    if (DB_TYPE === 'firebase' && firestore) {
      await firestore.deleteDocById('feedbacks', req.params.id);
      return res.json({ message: 'Feedback deleted' });
    } else if (pool) {
      await pool.query('DELETE FROM feedbacks WHERE id = ?', [req.params.id]);
      return res.json({ message: 'Feedback deleted' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
