// util-jwt.js

import jwt from 'jsonwebtoken';
import config from '../config.js'; // Ensure the path and file extension are correct
const { AUTH } = config;

// Create JWT
export const generateToken = (jwtObject, expiry) => {
  return jwt.sign(jwtObject, AUTH.jwt.secret, {
    expiresIn: expiry,
    issuer: 'AiAdvisor',
  });
};

export const verifyToken = (token) => {
  return jwt.verify(token, AUTH.jwt.secret, {}, (err, decoded) => {
    if (err) return false;
    return decoded;
  });
};

export const decodeToken = (token) => {
  return jwt.decode(token, { complete: true });
};


export default {
  generateToken,
  verifyToken,
  decodeToken,
}