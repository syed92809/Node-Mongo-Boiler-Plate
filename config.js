
import dotenv from 'dotenv';
dotenv.config();

let env = process.env.NODE_ENV || 'development';
let PORT = process.env.DEVELOPMENT_PORT;
let API_VERSION = process.env.DEVELOPMENT_API_VERSION;
let DATABASE_URL = process.env.DEVELOPMENT_DATABASE_URL;
let DATABASE_PORT = process.env.DEVELOPMENT_DATABASE_PORT;
let DATABASE_NAME = process.env.DEVELOPMENT_DATABASE_NAME;
let DATABASE_USER = process.env.DEVELOPMENT_DATABASE_USER;
let DATABASE_PASSWORD = process.env.DEVELOPMENT_DATABASE_PASSWORD;
let URL = process.env.DEVELOPMENT_URL;

let CLOUD_NAME = process.env.DEVELOPMENT_CLOUD_NAME;
let CLOUD_API_SECRET = process.env.DEVELOPMENT_CLOUD_API_SECRET;
let CLOUD_API_KEY = process.env.DEVELOPMENT_CLOUD_API_KEY;
let ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (env === 'production') {
  PORT = process.env.PRODUCTION_PORT;
  API_VERSION = process.env.PRODUCTION_API_VERSION;
  DATABASE_URL = process.env.PRODUCTION_DATABASE_URL;
  DATABASE_PORT = process.env.PRODUCTION_DATABASE_PORT;
  DATABASE_NAME = process.env.PRODUCTION_DATABASE_NAME;
  DATABASE_USER = process.env.PRODUCTION_DATABASE_USER;
  DATABASE_PASSWORD = process.env.PRODUCTION_DATABASE_PASSWORD;
  URL = process.env.PRODUCTION_URL;
}

// Email Settings
const EMAIL_CONFIG = {
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT || 587,
  email: process.env.EMAIL_USER || '<YOUR SMTP LOGIN EMAIL>',
  sender: process.env.EMAIL_SENDER || '<YOUR SMTP SENDER NAME>',
  senderEmail: process.env.EMAIL_SENDEREMAIL || '<YOUR SMTP SENDER EMAIL>',
  password: process.env.EMAIL_PASSWORD,
};

const AUTH = {
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN,
  },
};

export default {
  PORT,
  API_VERSION,
  AUTH,
  EMAIL_CONFIG,
  DATABASE_NAME,
  DATABASE_PASSWORD,
  DATABASE_URL,
  DATABASE_USER,
  DATABASE_PORT,
  CLOUD_NAME,
  CLOUD_API_KEY,
  CLOUD_API_SECRET,
  URL,
  ENCRYPTION_KEY,
};
