const express = require('express');
const router = express.Router();

const { DB_TYPE, firestore, pool } = require('../db');
const { getTherapyFee, getAdvanceAmount, getRemainingAmount, getPlatformRevenue } = require('../utils/fees');
const { createRazorpayOrder, verifyRazorpaySignature, RAZORPAY_KEY_ID } = require('../utils/razorpay');

function normalizePaymentFlags(sessionRow) {
  if (!sessionRow) return null;
  return {
    ...sessionRow,
    advancePaid: Boolean(sessionRow.advance_paid || sessionRow.advancePaid),
    remainingPaid: Boolean(sessionRow.remaining_paid || sessionRow.remainingPaid),
    offlineRemainingPaid: Boolean(sessionRow.offline_remaining_paid || sessionRow.offlineRemainingPaid)
  };
}

function isEligibleForAdvance(session) {
  return session && String(session.status || '').toLowerCase() === 'scheduled';
}

function isEligibleForRemaining(session) {
  return session && String(session.status || '').toLowerCase() === 'completed' && !session.remaining_paid && !session.offline_remaining_paid;
}

// ─── GET /api/payments/session/:id ────────────────────────────────────
router.get('/session/:id', async (req, res) => {
  try {
    let session = null;
    if (DB_TYPE === 'firebase' && firestore) {
      session = await firestore.getDocById('sessions', req.params.id);
    } else if (pool) {
      const [rows] = await pool.query('SELECT * FROM sessions WHERE id = ? LIMIT 1', [req.params.id]);
      if (rows.length > 0) session = rows[0];
    }

    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(normalizePaymentFlags(session));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/payments/session/:id/quote ─────────────────────────────
router.post('/session/:id/quote', async (req, res) => {
  try {
    let session = null;
    if (DB_TYPE === 'firebase' && firestore) {
      session = await firestore.getDocById('sessions', req.params.id);
    } else if (pool) {
      const [rows] = await pool.query('SELECT * FROM sessions WHERE id = ? LIMIT 1', [req.params.id]);
      if (rows.length > 0) session = rows[0];
    }

    if (!session) return res.status(404).json({ error: 'Session not found' });

    let totalFee = Number(session.total_fee || session.totalFee);
    if (!totalFee) totalFee = getTherapyFee(session.type);
    let advanceFee = Number(session.advance_fee || session.advanceFee);
    if (!advanceFee) advanceFee = getAdvanceAmount(totalFee);
    let remainingFee = Number(session.remaining_fee || session.remainingFee);
    if (!remainingFee) remainingFee = getRemainingAmount(totalFee);
    let platformRevenue = Number(session.platform_revenue || session.platformRevenue);
    if (!platformRevenue) platformRevenue = getPlatformRevenue(totalFee);

    res.json({
      sessionId: session.id,
      totalFee,
      advanceFee,
      remainingFee,
      platformRevenue,
      paymentStatus: session.payment_status || session.paymentStatus || 'advance_due'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/payments/session/:id/advance-order ─────────────────────
router.post('/session/:id/advance-order', async (req, res) => {
  try {
    let session = null;
    if (DB_TYPE === 'firebase' && firestore) {
      session = await firestore.getDocById('sessions', req.params.id);
    } else if (pool) {
      const [rows] = await pool.query('SELECT * FROM sessions WHERE id = ? LIMIT 1', [req.params.id]);
      if (rows.length > 0) session = rows[0];
    }

    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (!isEligibleForAdvance(session)) {
      return res.status(400).json({ error: 'Advance payment is not available for this session' });
    }

    let totalFee = Number(session.total_fee || session.totalFee);
    if (!totalFee) totalFee = getTherapyFee(session.type);
    let advanceFee = Number(session.advance_fee || session.advanceFee);
    if (!advanceFee) advanceFee = getAdvanceAmount(totalFee);
    let platformRevenue = Number(session.platform_revenue || session.platformRevenue);
    if (!platformRevenue) platformRevenue = getPlatformRevenue(totalFee);
    let remainingFee = Number(session.remaining_fee || session.remainingFee);
    if (!remainingFee) remainingFee = getRemainingAmount(totalFee);

    const order = await createRazorpayOrder({
      amountPaise: Math.round(advanceFee * 100),
      receipt: `session-${session.id}-advance`,
      notes: {
        sessionId: String(session.id),
        stage: 'advance',
        patientEmail: session.patient_email || session.patientEmail,
        doctorEmail: session.doctor_email || session.doctorEmail
      }
    });

    if (DB_TYPE === 'firebase' && firestore) {
      await firestore.updateDocById('sessions', req.params.id, {
        total_fee: totalFee,
        advance_fee: advanceFee,
        remaining_fee: remainingFee,
        platform_revenue: platformRevenue,
        razorpay_order_id: order.id,
        payment_status: 'advance_pending'
      });
    } else if (pool) {
      await pool.query(
        'UPDATE sessions SET total_fee = ?, advance_fee = ?, remaining_fee = ?, platform_revenue = ?, razorpay_order_id = ?, payment_status = ? WHERE id = ?',
        [totalFee, advanceFee, remainingFee, platformRevenue, order.id, 'advance_pending', req.params.id]
      );
    }

    res.json({
      orderId: order.id,
      amount: advanceFee,
      currency: order.currency || 'INR',
      keyId: RAZORPAY_KEY_ID
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/payments/session/:id/advance-verify ────────────────────
router.post('/session/:id/advance-verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    let session = null;
    if (DB_TYPE === 'firebase' && firestore) {
      session = await firestore.getDocById('sessions', req.params.id);
    } else if (pool) {
      const [rows] = await pool.query('SELECT * FROM sessions WHERE id = ? LIMIT 1', [req.params.id]);
      if (rows.length > 0) session = rows[0];
    }

    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (String(session.razorpay_order_id || '') !== String(razorpay_order_id || '')) {
      return res.status(400).json({ error: 'Order mismatch' });
    }

    const verified = verifyRazorpaySignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature
    });

    if (!verified) {
      return res.status(400).json({ error: 'Payment verification failed' });
    }

    if (DB_TYPE === 'firebase' && firestore) {
      await firestore.updateDocById('sessions', req.params.id, {
        advance_paid: true,
        razorpay_payment_id,
        razorpay_signature,
        payment_status: 'advance_paid'
      });
    } else if (pool) {
      await pool.query(
        'UPDATE sessions SET advance_paid = 1, razorpay_payment_id = ?, razorpay_signature = ?, payment_status = ? WHERE id = ?',
        [razorpay_payment_id, razorpay_signature, 'advance_paid', req.params.id]
      );
    }

    res.json({ message: 'Advance payment verified' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/payments/session/:id/remaining-order ───────────────────
router.post('/session/:id/remaining-order', async (req, res) => {
  try {
    let session = null;
    if (DB_TYPE === 'firebase' && firestore) {
      session = await firestore.getDocById('sessions', req.params.id);
    } else if (pool) {
      const [rows] = await pool.query('SELECT * FROM sessions WHERE id = ? LIMIT 1', [req.params.id]);
      if (rows.length > 0) session = rows[0];
    }

    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (!isEligibleForRemaining(session)) {
      return res.status(400).json({ error: 'Remaining payment is not available for this session' });
    }

    let totalFee = Number(session.total_fee || session.totalFee);
    if (!totalFee) totalFee = getTherapyFee(session.type);
    let remainingFee = Number(session.remaining_fee || session.remainingFee);
    if (!remainingFee) remainingFee = getRemainingAmount(totalFee);

    const order = await createRazorpayOrder({
      amountPaise: Math.round(remainingFee * 100),
      receipt: `session-${session.id}-remaining`,
      notes: {
        sessionId: String(session.id),
        stage: 'remaining',
        patientEmail: session.patient_email || session.patientEmail,
        doctorEmail: session.doctor_email || session.doctorEmail
      }
    });

    if (DB_TYPE === 'firebase' && firestore) {
      await firestore.updateDocById('sessions', req.params.id, {
        remaining_order_id: order.id,
        payment_status: 'remaining_pending'
      });
    } else if (pool) {
      await pool.query(
        'UPDATE sessions SET remaining_order_id = ?, payment_status = ? WHERE id = ?',
        [order.id, 'remaining_pending', req.params.id]
      );
    }

    res.json({
      orderId: order.id,
      amount: remainingFee,
      currency: order.currency || 'INR',
      keyId: RAZORPAY_KEY_ID
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/payments/session/:id/remaining-verify ──────────────────
router.post('/session/:id/remaining-verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    let session = null;
    if (DB_TYPE === 'firebase' && firestore) {
      session = await firestore.getDocById('sessions', req.params.id);
    } else if (pool) {
      const [rows] = await pool.query('SELECT * FROM sessions WHERE id = ? LIMIT 1', [req.params.id]);
      if (rows.length > 0) session = rows[0];
    }

    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (String(session.remaining_order_id || '') !== String(razorpay_order_id || '')) {
      return res.status(400).json({ error: 'Order mismatch' });
    }

    const verified = verifyRazorpaySignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature
    });

    if (!verified) {
      return res.status(400).json({ error: 'Payment verification failed' });
    }

    if (DB_TYPE === 'firebase' && firestore) {
      await firestore.updateDocById('sessions', req.params.id, {
        remaining_paid: true,
        remaining_payment_id: razorpay_payment_id,
        razorpay_signature,
        payment_status: 'paid',
        status: 'completed'
      });
    } else if (pool) {
      await pool.query(
        'UPDATE sessions SET remaining_paid = 1, remaining_payment_id = ?, razorpay_signature = ?, payment_status = ?, status = ? WHERE id = ?',
        [razorpay_payment_id, razorpay_signature, 'paid', 'completed', req.params.id]
      );
    }

    res.json({ message: 'Remaining payment verified' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/payments/session/:id/offline-paid ──────────────────────
router.post('/session/:id/offline-paid', async (req, res) => {
  try {
    let session = null;
    if (DB_TYPE === 'firebase' && firestore) {
      session = await firestore.getDocById('sessions', req.params.id);
    } else if (pool) {
      const [rows] = await pool.query('SELECT * FROM sessions WHERE id = ? LIMIT 1', [req.params.id]);
      if (rows.length > 0) session = rows[0];
    }

    if (!session) return res.status(404).json({ error: 'Session not found' });

    if (DB_TYPE === 'firebase' && firestore) {
      await firestore.updateDocById('sessions', req.params.id, {
        offline_remaining_paid: true,
        remaining_paid: true,
        payment_status: 'paid',
        status: 'completed'
      });
    } else if (pool) {
      await pool.query(
        'UPDATE sessions SET offline_remaining_paid = 1, remaining_paid = 1, payment_status = ?, status = ? WHERE id = ?',
        ['paid', 'completed', req.params.id]
      );
    }

    res.json({ message: 'Marked as paid offline' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/payments/admin/summary ──────────────────────────────────
router.get('/admin/summary', async (req, res) => {
  try {
    let sessions = [];
    if (DB_TYPE === 'firebase' && firestore) {
      sessions = await firestore.listDocs('sessions');
    } else if (pool) {
      const [rows] = await pool.query('SELECT total_fee, platform_revenue FROM sessions');
      sessions = rows;
    }

    const totals = sessions.reduce(
      (acc, row) => {
        const totalFee = Number(row.total_fee || row.totalFee || 0);
        const revenue = Number(row.platform_revenue || row.platformRevenue || getPlatformRevenue(totalFee));
        acc.totalFee += totalFee;
        acc.platformRevenue += revenue;
        return acc;
      },
      { totalFee: 0, platformRevenue: 0 }
    );

    res.json(totals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
