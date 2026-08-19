// API Routes for Patients
const express = require('express');
const router = express.Router();
const { DB_TYPE, firestore, pool } = require('../db');

// GET all patients
router.get('/', async (req, res) => {
  try {
    if (DB_TYPE === 'firebase' && firestore) {
      const patients = await firestore.listDocs('patients', { orderBy: 'created_at', orderDirection: 'desc' });
      return res.json(patients);
    } else if (pool) {
      const [rows] = await pool.query('SELECT * FROM patients ORDER BY created_at DESC');
      return res.json(rows);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET patient by id
router.get('/:id', async (req, res) => {
  try {
    if (DB_TYPE === 'firebase' && firestore) {
      const patient = await firestore.getDocById('patients', req.params.id);
      if (!patient) return res.status(404).json({ error: 'Patient not found' });
      return res.json(patient);
    } else if (pool) {
      const [rows] = await pool.query('SELECT * FROM patients WHERE id = ?', [req.params.id]);
      if (rows.length === 0) return res.status(404).json({ error: 'Patient not found' });
      return res.json(rows[0]);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create patient
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, age, therapy, status, join_date, last_visit } = req.body;
    if (DB_TYPE === 'firebase' && firestore) {
      const newPatient = await firestore.createDoc('patients', {
        name,
        email: email || '',
        phone: phone || '',
        age: age ? Number(age) : null,
        therapy: therapy || '',
        status: status || 'active',
        join_date: join_date || new Date().toISOString().split('T')[0],
        last_visit: last_visit || new Date().toISOString().split('T')[0]
      });
      return res.status(201).json({ id: newPatient.id, message: 'Patient created' });
    } else if (pool) {
      const [result] = await pool.query(
        'INSERT INTO patients (name, email, phone, age, therapy, status, join_date, last_visit) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [name, email, phone, age, therapy, status || 'active', join_date, last_visit]
      );
      return res.status(201).json({ id: result.insertId, message: 'Patient created' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update patient
router.put('/:id', async (req, res) => {
  try {
    const fields = req.body;
    if (DB_TYPE === 'firebase' && firestore) {
      await firestore.updateDocById('patients', req.params.id, fields);
      return res.json({ message: 'Patient updated' });
    } else if (pool) {
      const setClauses = Object.keys(fields).map(key => `${key} = ?`).join(', ');
      const values = Object.values(fields);
      values.push(req.params.id);

      await pool.query(`UPDATE patients SET ${setClauses} WHERE id = ?`, values);
      return res.json({ message: 'Patient updated' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE patient
router.delete('/:id', async (req, res) => {
  try {
    if (DB_TYPE === 'firebase' && firestore) {
      await firestore.deleteDocById('patients', req.params.id);
      return res.json({ message: 'Patient deleted' });
    } else if (pool) {
      await pool.query('DELETE FROM patients WHERE id = ?', [req.params.id]);
      return res.json({ message: 'Patient deleted' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
