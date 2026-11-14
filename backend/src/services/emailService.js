const nodemailer = require('nodemailer');
const { logger } = require('../utils/logger');

const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || 'kinjal.modismartbidsolutions@gmail.com';

let transporter = null;

// Enquiry fields come from the public contact form; never let them become HTML
const escapeHtml = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER || process.env.GMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASS;

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user, pass }
    });
  } else if (user && pass) {
    // Gmail service preset
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass }
    });
  }

  return transporter;
}

/**
 * Dispatch notification email to Kinjal Modi for new website inquiries
 */
async function sendEnquiryNotificationToAdmin(enquiry) {
  const targetEmail = ADMIN_EMAIL;
  logger.info(`📧 Routing enquiry notification to admin: ${targetEmail}`);

  const mailOptions = {
    from: process.env.SMTP_FROM || `"SmartBid Portal" <${process.env.SMTP_USER || 'no-reply@smartbidsolutions.in'}>`,
    to: targetEmail,
    subject: `🚨 [New SmartBid Lead] ${enquiry.subject || enquiry.service || 'Website Enquiry'} - ${enquiry.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #ffffff;">
        <div style="background: #0f172a; padding: 24px; color: #ffffff;">
          <h2 style="margin: 0; font-size: 20px; font-weight: bold;">SmartBid Solutions</h2>
          <p style="margin: 6px 0 0; font-size: 13px; color: #94a3b8;">New Customer Enquiry Received via Website</p>
        </div>
        
        <div style="padding: 24px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 8px 0; color: #64748b; width: 140px;">Customer Name:</td>
              <td style="padding: 8px 0; color: #0f172a; font-weight: bold;">${escapeHtml(enquiry.name)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Phone / Mobile:</td>
              <td style="padding: 8px 0; color: #0f172a; font-weight: bold;"><a href="tel:${escapeHtml(enquiry.phone || '')}" style="color: #2563eb; text-decoration: none;">${escapeHtml(enquiry.phone || 'Not provided')}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Email Address:</td>
              <td style="padding: 8px 0; color: #0f172a; font-weight: bold;"><a href="mailto:${escapeHtml(enquiry.email)}" style="color: #2563eb; text-decoration: none;">${escapeHtml(enquiry.email)}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Service / Subject:</td>
              <td style="padding: 8px 0; color: #0f172a; font-weight: bold;">${escapeHtml(enquiry.service || enquiry.subject || 'General')}</td>
            </tr>
          </table>

          <div style="margin-top: 20px; padding: 16px; background: #f8fafc; border-left: 4px solid #2563eb; border-radius: 4px;">
            <p style="margin: 0 0 6px; font-size: 12px; font-weight: bold; text-transform: uppercase; color: #64748b;">Message / Tender Requirement:</p>
            <p style="margin: 0; font-size: 14px; color: #1e293b; line-height: 1.5; white-space: pre-wrap;">${escapeHtml(enquiry.message)}</p>
          </div>

          <div style="margin-top: 24px; text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/enquiries" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 13px; border-radius: 8px;">
              Open Admin CRM to Manage Enquiry
            </a>
          </div>
        </div>

        <div style="background: #f1f5f9; padding: 16px; text-align: center; font-size: 11px; color: #64748b;">
          SmartBid Solutions • Default Helpline: +91 70162 35257 (Alt: +91 85117 22588) • Outside Delhi Darwaja, Ahmedabad, Gujarat • Direct Lead Notification
        </div>
      </div>
    `
  };

  const mailer = getTransporter();
  if (mailer) {
    try {
      const info = await mailer.sendMail(mailOptions);
      logger.info(`✅ Enquiry email dispatched to ${targetEmail} (MessageId: ${info.messageId})`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      logger.error(`❌ Failed to send enquiry email: ${err.message}`);
      return { success: false, error: err.message };
    }
  } else {
    logger.info(`ℹ️ [Email Dispatch Prepared] Recipient: ${targetEmail} | Lead from: ${enquiry.name} (${enquiry.phone || enquiry.email}). (Add SMTP_USER & SMTP_PASS in backend/.env to send live emails).`);
    return { success: true, mode: 'simulated' };
  }
}

module.exports = {
  ADMIN_EMAIL,
  sendEnquiryNotificationToAdmin,
};
