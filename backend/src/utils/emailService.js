const nodemailer = require('nodemailer');
const { executeQuery } = require('../config/database');
const logger = require('./logger');

const getTransporter = async () => {
  try {
    const configResult = await executeQuery('SELECT * FROM email_config WHERE is_active = true LIMIT 1');
    if (configResult.rows.length === 0) {
      logger.warn('Email configuration not found or inactive');
      return null;
    }

    const config = configResult.rows[0];
    return nodemailer.createTransport({
      host: config.smtp_host,
      port: config.smtp_port,
      secure: config.smtp_port === 465, // true for 465, false for other ports
      auth: {
        user: config.smtp_user,
        pass: config.smtp_password,
      },
    });
  } catch (err) {
    logger.error('Error creating email transporter:', err.message);
    return null;
  }
};

const sendMail = async ({ to, subject, text, html, referenceType, referenceId }) => {
  try {
    const transporter = await getTransporter();
    if (!transporter) return false;

    const configResult = await executeQuery('SELECT from_email, from_name FROM email_config WHERE is_active = true LIMIT 1');
    const config = configResult.rows[0];

    const info = await transporter.sendMail({
      from: `"${config.from_name}" <${config.from_email}>`,
      to,
      subject,
      text,
      html,
    });

    // Log the notification
    await executeQuery(
      `INSERT INTO notification_log (event_type, reference_type, reference_id, recipient_email, subject, status, sent_date)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      ['EMAIL', referenceType || 'GENERAL', referenceId || null, to, subject, 'Sent']
    );

    logger.info(`Email sent: ${info.messageId}`);
    return true;
  } catch (err) {
    logger.error('Error sending email:', err.message);
    
    // Log failed notification
    await executeQuery(
      `INSERT INTO notification_log (event_type, reference_type, reference_id, recipient_email, subject, status, error_message)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      ['EMAIL', referenceType || 'GENERAL', referenceId || null, to, subject, 'Failed', err.message]
    );
    
    return false;
  }
};

module.exports = { sendMail };
