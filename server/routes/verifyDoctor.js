// ─── Doctor Verification Route (Cache-First + Live MCIM Scrape) ────────────
// GET /api/verify-doctor?regNo=XXXXX
//
// Flow:
//   1. Check local cache (Firestore or MySQL) → return immediately if found (source: "database")
//   2. If cache miss → run Playwright scraper against MCIM website
//   3. If scraper finds the doctor → save into cache → return (source: "live_scraped")
//   4. If no result → return 404

const express = require('express');
const router = express.Router();
const { DB_TYPE, firestore, pool } = require('../db');
const { scrapeMCIMDoctor } = require('../utils/mcimScraper');

// GET /api/verify-doctor?regNo=12345
router.get('/', async (req, res) => {
  const { regNo } = req.query;

  // ── Validate input ──────────────────────────────────────────────────────
  if (!regNo || !String(regNo).trim()) {
    return res.status(400).json({
      success: false,
      error: 'Missing required query parameter: regNo'
    });
  }

  const registrationNumber = String(regNo).trim();

  try {
    // ── Step 1: Check cache first ───────────────────────────────────────
    if (DB_TYPE === 'firebase' && firestore) {
      const cached = await firestore.findOneDoc('verified_doctors', 'registration_number', registrationNumber);
      if (cached) {
        console.log(`[Verify] Cache HIT (Firestore) for regNo: ${registrationNumber}`);
        return res.json({
          success: true,
          source: 'database',
          data: {
            registrationNumber: cached.registration_number,
            fullName: cached.full_name,
            qualification: cached.qualification,
            status: cached.status,
            cachedAt: cached.created_at
          }
        });
      }
    } else if (pool) {
      const [rows] = await pool.query(
        'SELECT * FROM verified_doctors WHERE registration_number = ?',
        [registrationNumber]
      );

      if (rows.length > 0) {
        console.log(`[Verify] Cache HIT (MySQL) for regNo: ${registrationNumber}`);
        return res.json({
          success: true,
          source: 'database',
          data: {
            registrationNumber: rows[0].registration_number,
            fullName: rows[0].full_name,
            qualification: rows[0].qualification,
            status: rows[0].status,
            cachedAt: rows[0].created_at
          }
        });
      }
    }

    // ── Step 2: Cache MISS → Run live MCIM scraper ──────────────────────
    console.log(`[Verify] Cache MISS for regNo: ${registrationNumber}. Launching scraper...`);

    let scrapedData;
    try {
      scrapedData = await scrapeMCIMDoctor(registrationNumber);
    } catch (scrapeError) {
      // Scraper failed (no record, timeout, page changed, etc.)
      return res.status(404).json({
        success: false,
        source: 'live_scraped',
        error: scrapeError.message || 'Doctor not found on MCIM portal'
      });
    }

    // ── Step 3: INSERT scraped data into cache for future lookups ───────
    if (DB_TYPE === 'firebase' && firestore) {
      const existing = await firestore.findOneDoc('verified_doctors', 'registration_number', scrapedData.registrationNumber);
      if (existing) {
        await firestore.updateDocById('verified_doctors', existing.id, {
          full_name: scrapedData.fullName,
          qualification: scrapedData.qualification,
          status: scrapedData.status
        });
      } else {
        await firestore.createDoc('verified_doctors', {
          registration_number: scrapedData.registrationNumber,
          full_name: scrapedData.fullName,
          qualification: scrapedData.qualification,
          status: scrapedData.status
        });
      }
      console.log(`[Verify] Scraped and cached in Firestore regNo: ${registrationNumber}`);
    } else if (pool) {
      await pool.query(
        `INSERT INTO verified_doctors (registration_number, full_name, qualification, status)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           full_name = VALUES(full_name),
           qualification = VALUES(qualification),
           status = VALUES(status),
           updated_at = CURRENT_TIMESTAMP`,
        [
          scrapedData.registrationNumber,
          scrapedData.fullName,
          scrapedData.qualification,
          scrapedData.status
        ]
      );
      console.log(`[Verify] Scraped and cached in MySQL regNo: ${registrationNumber}`);
    }

    return res.json({
      success: true,
      source: 'live_scraped',
      data: scrapedData
    });

  } catch (error) {
    console.error('[Verify] Unexpected error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during verification',
      details: error.message
    });
  }
});

module.exports = router;
