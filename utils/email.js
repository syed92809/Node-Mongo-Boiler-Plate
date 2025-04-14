import nodemailer from 'nodemailer';
import config from '../config.js';
const { EMAIL_CONFIG } = config;

export const sendEmail = async ({ to, subject, text, html, from = `"${EMAIL_CONFIG.sender}" <${EMAIL_CONFIG.senderEmail}>` }) => {
  const transport = nodemailer.createTransport({
    port: EMAIL_CONFIG.port,
    host: EMAIL_CONFIG.host,
    secure: false,
    auth: {
      user: EMAIL_CONFIG.email,
      pass: EMAIL_CONFIG.password,
    },
  });

  const options = {
    to,
    from,
    subject,
    text,
    html
    // html can be added here if needed
  };

  try {
    const result = await transport.sendMail(options);
    return result;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

export const isValidEmail = (email) => {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
};
