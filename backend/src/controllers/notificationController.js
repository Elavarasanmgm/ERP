const { executeQuery } = require('../config/database');
const logger = require('../utils/logger');
const { sendMail } = require('../utils/emailService');

const getNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await executeQuery(
      `SELECT * FROM system_notifications 
       WHERE (user_id = $1 OR user_id IS NULL)
       ORDER BY created_date DESC LIMIT 50`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    logger.error('getNotifications:', err.message);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    await executeQuery(
      `UPDATE system_notifications SET is_read = true 
       WHERE id = $1 AND (user_id = $2 OR user_id IS NULL)`,
      [id, userId]
    );
    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    logger.error('markAsRead:', err.message);
    res.status(500).json({ error: 'Failed to update notification' });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    await executeQuery(
      `UPDATE system_notifications SET is_read = true 
       WHERE (user_id = $1 OR user_id IS NULL) AND is_read = false`,
      [userId]
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    logger.error('markAllAsRead:', err.message);
    res.status(500).json({ error: 'Failed to update notifications' });
  }
};

const generateStockAlerts = async (req, res) => {
  try {
    // This could be called by a cron job or manually for now
    const lowStockItems = await executeQuery(
      `SELECT i.itemid, i.itemname, i.itemcode, i.reorderlevel, SUM(s.quantity) as total_qty
       FROM items i
       JOIN stock s ON i.itemid = s.itemid
       WHERE i.isactive = true
       GROUP BY i.itemid, i.itemname, i.itemcode, i.reorderlevel
       HAVING SUM(s.quantity) <= i.reorderlevel AND i.reorderlevel > 0`
    );

    let count = 0;
    let emailSent = 0;

    // Get Admin emails for notifications
    const admins = await executeQuery("SELECT email FROM users WHERE role = 'Admin' AND isactive = true");
    const adminEmails = admins.rows.map(a => a.email);

    for (const item of lowStockItems.rows) {
      // Check if a notification already exists for this item that is unread
      const existing = await executeQuery(
        `SELECT id FROM system_notifications 
         WHERE reference_type = 'LOW_STOCK' AND reference_id = $1 AND is_read = false`,
        [item.itemid]
      );

      if (existing.rows.length === 0) {
        const title = 'Low Stock Alert';
        const message = `Item ${item.itemname} (${item.itemcode}) is below reorder level. Current: ${item.total_qty}, Reorder Level: ${item.reorderlevel}`;

        await executeQuery(
          `INSERT INTO system_notifications (title, message, type, reference_type, reference_id)
           VALUES ($1, $2, $3, $4, $5)`,
          [title, message, 'Warning', 'LOW_STOCK', item.itemid]
        );
        count++;

        // Send Email to Admins
        if (adminEmails.length > 0) {
          const emailResult = await sendMail({
            to: adminEmails.join(','),
            subject: `[ERP ALERT] Low Stock: ${item.itemname}`,
            text: message,
            html: `
              <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
                <h2 style="color: #d97706;">Low Stock Alert</h2>
                <p>Hello Admin,</p>
                <p>The following item has reached its reorder level:</p>
                <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                  <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><b>Item:</b></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${item.itemname} (${item.itemcode})</td></tr>
                  <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><b>Current Quantity:</b></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${item.total_qty}</td></tr>
                  <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><b>Reorder Level:</b></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${item.reorderlevel}</td></tr>
                </table>
                <p style="margin-top: 20px;">Please take necessary action for replenishment.</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="font-size: 12px; color: #777;">This is an automated message from your ERP System.</p>
              </div>
            `,
            referenceType: 'LOW_STOCK',
            referenceId: item.itemid
          });
          if (emailResult) emailSent++;
        }
      }
    }

    res.json({ message: `Generated ${count} new stock alerts and sent ${emailSent} notification emails.` });
  } catch (err) {
    logger.error('generateStockAlerts:', err.message);
    res.status(500).json({ error: 'Failed to generate stock alerts' });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  generateStockAlerts
};
