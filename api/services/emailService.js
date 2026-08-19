const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Envia un correo electronico utilizando la configuracion SMTP.
 * @param {Object} options 
 * @param {string} options.to Destinatario
 * @param {string} options.subject Asunto
 * @param {string} options.text Texto del cuerpo
 * @returns {Promise}
 */
async function sendEmail({ to, subject, text, html, attachments = [] }) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('⚠️ SMTP_USER o SMTP_PASS no están configurados. El email no se enviará.');
    return null;
  }

  const mailOptions = {
    from: `"Chiappital Alertas" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
    html,
    attachments,
  };
  return transporter.sendMail(mailOptions);
}

module.exports = { sendEmail };
