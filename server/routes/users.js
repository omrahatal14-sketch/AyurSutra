// API Routes for Users
const express = require('express');
const router = express.Router();
const { DB_TYPE, firestore, pool } = require('../db');

// GET all users
router.get('/', async (req, res) => {
  try {
    if (DB_TYPE === 'firebase' && firestore) {
      const users = await firestore.listDocs('users', { orderBy: 'created_at', orderDirection: 'desc' });
      return res.json(users);
    } else if (pool) {
      const [rows] = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
      return res.json(rows);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET user by email
router.get('/email/:email', async (req, res) => {
  try {
    if (DB_TYPE === 'firebase' && firestore) {
      const user = await firestore.findOneDoc('users', 'email', req.params.email);
      if (!user) return res.status(404).json({ error: 'User not found' });
      return res.json(user);
    } else if (pool) {
      const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [req.params.email]);
      if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
      return res.json(rows[0]);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET users by role
router.get('/role/:role', async (req, res) => {
  try {
    if (DB_TYPE === 'firebase' && firestore) {
      const users = await firestore.findDocs('users', 'role', req.params.role);
      return res.json(users);
    } else if (pool) {
      const [rows] = await pool.query('SELECT * FROM users WHERE role = ?', [req.params.role]);
      return res.json(rows);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create user
router.post('/', async (req, res) => {
  try {
    const { uid, name, email, role, approved } = req.body;
    if (DB_TYPE === 'firebase' && firestore) {
      const newUser = await firestore.createDoc('users', {
        uid: uid || null,
        name,
        email,
        role: role || 'patient',
        approved: approved ?? false
      });
      return res.status(201).json({ id: newUser.id, message: 'User created' });
    } else if (pool) {
      const [result] = await pool.query(
        'INSERT INTO users (uid, name, email, role, approved) VALUES (?, ?, ?, ?, ?)',
        [uid, name, email, role || 'patient', approved || false]
      );
      return res.status(201).json({ id: result.insertId, message: 'User created' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update user
router.put('/:id', async (req, res) => {
  try {
    const fields = req.body;
    if (DB_TYPE === 'firebase' && firestore) {
      await firestore.updateDocById('users', req.params.id, fields);
      return res.json({ message: 'User updated' });
    } else if (pool) {
      const setClauses = Object.keys(fields).map(key => `${key} = ?`).join(', ');
      const values = Object.values(fields);
      values.push(req.params.id);

      await pool.query(`UPDATE users SET ${setClauses} WHERE id = ?`, values);
      return res.json({ message: 'User updated' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE user
router.delete('/:id', async (req, res) => {
  try {
    if (DB_TYPE === 'firebase' && firestore) {
      await firestore.deleteDocById('users', req.params.id);
      return res.json({ message: 'User deleted' });
    } else if (pool) {
      await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
      return res.json({ message: 'User deleted' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
