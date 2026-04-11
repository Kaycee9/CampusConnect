import nodemailer from 'nodemailer';
import env from '../config/env.js';

const canSendEmail = () => Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);

export const sendEmail = async ({ to, subject, html }) => {
  if (!canSendEmail()) {
    console.warn('SMTP is not configured. Skipping email send.');
    return { sent: false };
  }

  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: env.EMAIL_FROM,
    to,
    subject,
    html,
  });

  return { sent: true };
};
