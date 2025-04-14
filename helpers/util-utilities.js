// util.js

import cacheHelper from './util-Cache.js';
import config from '../config.js';
const { AUTH } = config;
import jwtHelper from './util-jwt.js';
import {_responseWrapper} from './util-response.js';


/**
 * @function emailAttributerFormatter
 * @description return regex pattern of email attribute
 * @requires emailAttribute(String)
 */
export const emailAttributerFormatter = (emailAttribute) => {
  const regexVariable = `\\$\\$${emailAttribute}\\$\\$`;
  return new RegExp(regexVariable, 'g');
};

/**
 * @function generateJWTToken
 * @description return jwt token
 * @requires auth(Object)
 */
export const generateJWTToken = async (auth) => {
  const JWT_object = {
    email: auth.email,
    _id: auth._id,
  };

  const token = jwtHelper.generateToken(JWT_object, AUTH.jwt.expiresIn);
  const temp_obj = {
    _id: auth._id,
  };

  await cacheHelper.initSession(
    cacheHelper.cacheInstance['session-cache'],
    token,
    temp_obj
  );

  return token;
};



export const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};
