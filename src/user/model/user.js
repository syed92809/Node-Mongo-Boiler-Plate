/** @format */
import mongoose from 'mongoose';
import joigoose from 'joigoose';
const { convert } = joigoose(mongoose);
import crypto from 'crypto';
import Joi from 'joi';
import bcrypt from 'bcrypt';
import baseSchema from '../../baseSchema.js';
import { isValidEmail } from '../../../utils/email.js';
import generalFunctions from '../../../helpers/util-generic-functions.js';
const { referenceValidator } = generalFunctions;


const userJoigooseSchema = Joi.object({
  firstName: Joi.string()
    .required()
    .min(1),
  lastName: Joi.string()
    .allow('')
    .default(''),
  email: Joi.string()
    .email()
    .required(),
  avatar: Joi.string(),
  location: Joi.object({
    address: Joi.string(),
    city: Joi.string(),
    latitude: Joi.number(),
    longitude: Joi.number(),
  }),
  phoneNo: Joi.number(),
  password: Joi.string()
    .required()
    .min(8),
  dietaries: Joi.array().items(Joi.string()),
  allergies: Joi.array().items(Joi.string()),
  passwordResetToken: Joi.string(),
  passwordResetExpires: Joi.date(),
  passwordChangeAt: Joi.date(),
  isAdmin: Joi.boolean().default(false),
  role: Joi.string().valid('user', 'admin', 'restaurant-owner', 'restaurant-staff'),
  FCMTokens: Joi.array().items(Joi.string()),
  verified: Joi.boolean().default(false),
  restaurant: Joi.string(),
  subRole: Joi.string()
    .when('role', {
      is: 'restaurant-staff',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
  ...baseSchema,
});

// Convert Joi schema to Mongoose schema
let userSchema = convert(userJoigooseSchema);
userSchema.email.unique = true;
userSchema.email.lowercase = true;
// userSchema.phone.unique = true;
userSchema.password.select = false;

userSchema.dietaries = [{ type: mongoose.Schema.Types.ObjectId, ref: 'Dietary', validate: referenceValidator('Dietary') }];
userSchema.allergies = [{ type: mongoose.Schema.Types.ObjectId, ref: 'Allergies', validate: referenceValidator('Allergies') }];
userSchema.restaurant = { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', validate: referenceValidator('Restaurant') };
userSchema.subRole = { type: mongoose.Schema.Types.ObjectId, ref: 'SubRole', validate: referenceValidator('SubRole') };

userSchema = new mongoose.Schema(userSchema);

userSchema.methods = {
  verifyPassword(candidatePwd) {
    return bcrypt.compare(candidatePwd, this.password);
  },

  generatePwdResetToken() {
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetExpires = Date.now() + parseInt(process.env.RESET_TOKEN_EXPIRY || 20 * 60 * 1000, 10);
    return resetToken;
  },

  changePasswordAfter(jwtIssueDate) {
    return this.passwordChangeAt && this.passwordChangeAt.getTime() > jwtIssueDate * 1000; // jwtIssueDate is in seconds
  },
};

userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
    if (!this.isNew) {
      this.passwordChangeAt = Date.now() - 1000; // 1 second ago
    }
  }
  next();
});

userSchema.path('email').validate(function (email) {
  return isValidEmail(email);
}, '({VALUE}) is not a valid email');

// create the Instance of user
const User = mongoose.model('User', userSchema);

// validate the user input by passing it to joigoose schema
const validateUser = userData => userJoigooseSchema.validate(userData);

export {
  User,
  validateUser,
};