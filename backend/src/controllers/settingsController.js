const { executeQuery } = require('../config/database');
const logger = require('../utils/logger');
const nodemailer = require('nodemailer');

// ─── Company Settings ─────────────────────────────────────────────────────────

const getCompanySettings = async (req, res) => {
  try {
    const result = await executeQuery(`SELECT * FROM company_settings LIMIT 1`);
    res.json(result.rows[0] || {});
  } catch (err) {
    logger.error('getCompanySettings:', err.message);
    res.status(500).json({ error: 'Failed to fetch company settings' });
  }
};

const upsertCompanySettings = async (req, res) => {
  try {
    const {
      company_name, company_address, city, state, pincode, country,
      phone, email, website, gst_number, pan_number, cin_number,
      logo_path, financial_year_start, base_currency, date_format
    } = req.body;

    // Check if row exists
    const existing = await executeQuery(`SELECT id FROM company_settings LIMIT 1`);
    if (existing.rows.length > 0) {
      await executeQuery(
        `UPDATE company_settings SET
          company_name=$1, company_address=$2, city=$3, state=$4, pincode=$5, country=$6,
          phone=$7, email=$8, website=$9, gst_number=$10, pan_number=$11, cin_number=$12,
          logo_path=$13, financial_year_start=$14, base_currency=$15, date_format=$16,
          updated_date=NOW()
         WHERE id=$17`,
        [company_name, company_address, city, state, pincode, country || 'India',
         phone, email, website, gst_number, pan_number, cin_number,
         logo_path, financial_year_start || '04-01', base_currency || 'INR', date_format || 'DD/MM/YYYY',
         existing.rows[0].id]
      );
    } else {
      await executeQuery(
        `INSERT INTO company_settings
          (company_name, company_address, city, state, pincode, country,
           phone, email, website, gst_number, pan_number, cin_number,
           logo_path, financial_year_start, base_currency, date_format, updated_date)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,NOW())`,
        [company_name, company_address, city, state, pincode, country || 'India',
         phone, email, website, gst_number, pan_number, cin_number,
         logo_path, financial_year_start || '04-01', base_currency || 'INR', date_format || 'DD/MM/YYYY']
      );
    }
    res.json({ message: 'Company settings saved' });
  } catch (err) {
    logger.error('upsertCompanySettings:', err.message);
    res.status(500).json({ error: 'Failed to save company settings' });
  }
};

// ─── Number Sequences ─────────────────────────────────────────────────────────

const getSequences = async (req, res) => {
  try {
    const result = await executeQuery(
      `SELECT id, document_type, prefix, current_number, format, reset_yearly, financial_year, updated_date
       FROM number_sequences ORDER BY document_type`
    );
    res.json(result.rows);
  } catch (err) {
    logger.error('getSequences:', err.message);
    res.status(500).json({ error: 'Failed to fetch sequences' });
  }
};

const getNextNumber = async (req, res) => {
  try {
    const { document_type } = req.params;
    const result = await executeQuery(
      `SELECT prefix, current_number + 1 AS next_number, format
       FROM number_sequences WHERE document_type = $1`,
      [document_type]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Sequence not found for document type' });
    const { prefix, next_number, format } = result.rows[0];
    const formatted = format
      ? format.replace('{PREFIX}', prefix).replace('{NUM}', String(next_number).padStart(5, '0'))
      : `${prefix}-${String(next_number).padStart(5, '0')}`;
    res.json({ document_type, next_number, formatted });
  } catch (err) {
    logger.error('getNextNumber:', err.message);
    res.status(500).json({ error: 'Failed to get next number' });
  }
};

const updateSequence = async (req, res) => {
  try {
    const { id } = req.params;
    const { prefix, current_number, format, reset_yearly } = req.body;
    await executeQuery(
      `UPDATE number_sequences SET prefix=$1, current_number=$2, format=$3, reset_yearly=$4, updated_date=NOW() WHERE id=$5`,
      [prefix, current_number, format, reset_yearly, id]
    );
    res.json({ message: 'Sequence updated' });
  } catch (err) {
    logger.error('updateSequence:', err.message);
    res.status(500).json({ error: 'Failed to update sequence' });
  }
};

// ─── Email Settings ───────────────────────────────────────────────────────────

const getEmailSettings = async (req, res) => {
  try {
    const result = await executeQuery(`SELECT * FROM email_config LIMIT 1`);
    res.json(result.rows[0] || {});
  } catch (err) {
    logger.error('getEmailSettings:', err.message);
    res.status(500).json({ error: 'Failed to fetch email settings' });
  }
};

const upsertEmailSettings = async (req, res) => {
  try {
    const {
      smtp_host, smtp_port, smtp_user, smtp_password,
      from_email, from_name, is_active
    } = req.body;

    const existing = await executeQuery(`SELECT id FROM email_config LIMIT 1`);
    if (existing.rows.length > 0) {
      await executeQuery(
        `UPDATE email_config SET
          smtp_host=$1, smtp_port=$2, smtp_user=$3, smtp_password=$4,
          from_email=$5, from_name=$6, is_active=$7, updated_date=NOW()
         WHERE id=$8`,
        [smtp_host, smtp_port, smtp_user, smtp_password, from_email, from_name, is_active ?? true, existing.rows[0].id]
      );
    } else {
      await executeQuery(
        `INSERT INTO email_config
          (smtp_host, smtp_port, smtp_user, smtp_password, from_email, from_name, is_active, updated_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [smtp_host, smtp_port, smtp_user, smtp_password, from_email, from_name, is_active ?? true]
      );
    }
    res.json({ message: 'Email settings saved' });
  } catch (err) {
    logger.error('upsertEmailSettings:', err.message);
    res.status(500).json({ error: 'Failed to save email settings' });
  }
};

const testEmailConnection = async (req, res) => {
  try {
    const { smtp_host, smtp_port, smtp_user, smtp_password, from_email } = req.body;

    const transporter = nodemailer.createTransport({
      host: smtp_host,
      port: parseInt(smtp_port),
      secure: parseInt(smtp_port) === 465,
      auth: { user: smtp_user, pass: smtp_password },
      connectTimeout: 10000,
    });

    await transporter.verify();
    res.json({ message: 'SMTP Connection successful! Credentials are valid.' });
  } catch (err) {
    logger.error('testEmailConnection error:', err.message);
    res.status(500).json({ error: `Connection failed: ${err.message}` });
  }
};

// Internal helper: increment and return next document number
async function nextDocNumber(document_type) {
  const r = await executeQuery(
    `UPDATE number_sequences SET current_number = current_number + 1, updated_date = NOW()
     WHERE document_type = $1
     RETURNING prefix, current_number, format`,
    [document_type]
  );
  if (r.rows.length === 0) return null;
  const { prefix, current_number, format } = r.rows[0];
  return format
    ? format.replace('{PREFIX}', prefix).replace('{NUM}', String(current_number).padStart(5, '0'))
    : `${prefix}-${String(current_number).padStart(5, '0')}`;
}

module.exports = {
  getCompanySettings,
  upsertCompanySettings,
  getSequences,
  getNextNumber,
  updateSequence,
  getEmailSettings,
  upsertEmailSettings,
  testEmailConnection,
  nextDocNumber,
};
