const { executeQuery } = require('../config/database');
const logger = require('../utils/logger');
const axios = require('axios');

// GST number format validation: 2-digit state + 10 PAN + 1 + Z + checksum
const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

const verifyGst = async (req, res) => {
  try {
    const { gst_number } = req.params;
    const userId = req.user?.userId || null;

    if (!GST_REGEX.test(gst_number)) {
      return res.status(400).json({ error: 'Invalid GST number format' });
    }

    // Return cached result if fetched within 24h
    const cached = await executeQuery(
      `SELECT fetched_data, status, fetched_date FROM gst_fetch_log
       WHERE gst_number = $1 AND fetched_date > NOW() - INTERVAL '24 hours'
       ORDER BY fetched_date DESC LIMIT 1`,
      [gst_number]
    );
    if (cached.rows.length > 0) {
      return res.json({ source: 'cache', ...cached.rows[0].fetched_data });
    }

    // Try external GST API (using a public sandbox / mock response for now)
    let gstData = null;
    let fetchStatus = 'success';
    try {
      // Using a mock response since production GST API requires credentials
      // Replace with actual API: https://api.cleartax.in or GST Sewa Kendra
      gstData = {
        gst_number,
        legal_name: `Company for ${gst_number}`,
        trade_name: `Trade for ${gst_number}`,
        status: 'Active',
        state_code: gst_number.substring(0, 2),
        address: 'Fetched via GST API',
        registration_type: 'Regular',
      };
    } catch (apiErr) {
      fetchStatus = 'failed';
      logger.warn(`GST API fetch failed for ${gst_number}: ${apiErr.message}`);
    }

    // Log the fetch
    await executeQuery(
      `INSERT INTO gst_fetch_log (gst_number, fetched_data, fetched_by, fetched_date, status)
       VALUES ($1, $2, $3, NOW(), $4)`,
      [gst_number, JSON.stringify(gstData || {}), userId, fetchStatus]
    );

    if (!gstData) return res.status(502).json({ error: 'GST API unavailable. Try again.' });

    res.json({ source: 'api', ...gstData });
  } catch (err) {
    logger.error('verifyGst:', err.message);
    res.status(500).json({ error: 'Failed to verify GST' });
  }
};

const getGstFetchHistory = async (req, res) => {
  try {
    const result = await executeQuery(
      `SELECT g.id, g.gst_number, g.status, g.fetched_date,
              u.email AS fetched_by
       FROM gst_fetch_log g
       LEFT JOIN users u ON u.userid = g.fetched_by
       ORDER BY g.fetched_date DESC LIMIT 100`
    );
    res.json(result.rows);
  } catch (err) {
    logger.error('getGstFetchHistory:', err.message);
    res.status(500).json({ error: 'Failed to fetch GST history' });
  }
};

module.exports = { verifyGst, getGstFetchHistory };
