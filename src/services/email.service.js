const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
      logger.warn('Email configuration missing. Skipping email sending.');
      return;
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.FROM_EMAIL,
      to,
      subject,
      text,
      html
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Email sent to ${to}`);
  } catch (error) {
    logger.error('Error sending email:', error);
    // Don't throw error for email failures
  }
};

const sendBookingConfirmation = async (user, booking, event) => {
  const subject = `Booking Confirmation: ${event.name}`;
  const html = `
    <h1>Booking Confirmation</h1>
    <p>Dear ${user.name},</p>
    <p>Your booking has been confirmed.</p>
    <h2>Booking Details:</h2>
    <ul>
      <li>Event: ${event.name}</li>
      <li>Date: ${event.date.toLocaleDateString()}</li>
      <li>Location: ${event.location}</li>
      <li>Tickets: ${booking.tickets}</li>
      <li>Total Amount: $${booking.totalAmount}</li>
      <li>Booking ID: ${booking._id}</li>
    </ul>
    <p>Thank you for using our service!</p>
  `;

  await sendEmail({
    to: user.email,
    subject,
    html
  });
};

const sendEventReminder = async (users, event) => {
  const subject = `Reminder: ${event.name} is tomorrow!`;
  
  for (const user of users) {
    const html = `
      <h1>Event Reminder</h1>
      <p>Dear ${user.name},</p>
      <p>This is a reminder that "${event.name}" is happening tomorrow!</p>
      <p><strong>Event Details:</strong></p>
      <ul>
        <li>Time: ${event.date.toLocaleString()}</li>
        <li>Location: ${event.location}</li>
      </ul>
      <p>We look forward to seeing you there!</p>
    `;

    await sendEmail({
      to: user.email,
      subject,
      html
    });
  }
};

module.exports = {
  sendEmail,
  sendBookingConfirmation,
  sendEventReminder
};