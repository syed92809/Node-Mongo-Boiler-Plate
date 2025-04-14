import config from '../config.js';
const { DATABASE_URL, DATABASE_PASSWORD, DATABASE_NAME, DATABASE_PORT, DATABASE_USER } = config;

export default {
  user: DATABASE_USER,
  password: DATABASE_PASSWORD,
  db: DATABASE_NAME,
  url: `mongodb${DATABASE_PORT ? '' : '+srv'}://${DATABASE_URL}${DATABASE_PORT ? ":" + DATABASE_PORT : ""}/${DATABASE_NAME}`
}; 