// API Routes for Requests (therapy session requests)
const express = require('express');
const router = express.Router();
const { DB_TYPE, firestore, pool } = require('../db');

// GET all requests
router.get('/', async (req, res) => {
  try {
    if (DB_TYPE === 'firebase' && firestore) {
      const requests = await firestore.listDocs('requests', { orderBy: 'created_at', orderDirection: 'desc' });
      return res.json(requests);
    } else if (pool) {
      const [rows] = await pool.query('SELECT * FROM requests ORDER BY created_at DESC');
      return res.json(rows);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET requests by doctor email
router.get('/doctor/:email', async (req, res) => {
  try {
    if (DB_TYPE === 'firebase' && firestore) {
      const requests = await firestore.findDocs('requests', 'doctor_email', req.params.email, 'created_at', 'desc');
      return res.json(requests);
    } else if (pool) {
      const [rows] = await pool.query('SELECT * FROM requests WHERE doctor_email = ? ORDER BY created_at DESC', [req.params.email]);
      return res.json(rows);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET requests by patient email
router.get('/patient/:email', async (req, res) => {
  try {
    if (DB_TYPE === 'firebase' && firestore) {
      const requests = await firestore.findDocs('requests', 'patient_email', req.params.email, 'created_at', 'desc');
      return res.json(requests);
    } else if (pool) {
      const [rows] = await pool.query('SELECT * FROM requests WHERE patient_email = ? ORDER BY created_at DESC', [req.params.email]);
      return res.json(rows);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create request
router.post('/', async (req, res) => {
  try {
    const { patient_email, doctor_email, therapy, date, time } = req.body;
    if (DB_TYPE === 'firebase' && firestore) {
      const newRequest = await firestore.createDoc('requests', {
        patient_email: patient_email || '',
        doctor_email: doctor_email || '',
        therapy: therapy || '',
        date: date || '',
        time: time || '',
        status: 'pending'
      });
      return res.status(201).json({ id: newRequest.id, message: 'Request created' });
    } else if (pool) {
      const [result] = await pool.query(
        'INSERT INTO requests (patient_email, doctor_email, therapy, date, time) VALUES (?, ?, ?, ?, ?)',
        [patient_email, doctor_email, therapy, date, time]
      );
      return res.status(201).json({ id: result.insertId, message: 'Request created' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update request (accept/reject)
router.put('/:id', async (req, res) => {
  try {
    const fields = req.body;
    if (DB_TYPE === 'firebase' && firestore) {
      await firestore.updateDocById('requests', req.params.id, fields);
      return res.json({ message: 'Request updated' });
    } else if (pool) {
      const setClauses = Object.keys(fields).map(key => `${key} = ?`).join(', ');
      const values = Object.values(fields);
      values.push(req.params.id);

      await pool.query(`UPDATE requests SET ${setClauses} WHERE id = ?`, values);
      return res.json({ message: 'Request updated' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE request
router.delete('/:id', async (req, res) => {
  try {
    if (DB_TYPE === 'firebase' && firestore) {
      await firestore.deleteDocById('requests', req.params.id);
      return res.json({ message: 'Request deleted' });
    } else if (pool) {
      await pool.query('DELETE FROM requests WHERE id = ?', [req.params.id]);
      return res.json({ message: 'Request deleted' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
