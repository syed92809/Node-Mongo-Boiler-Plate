/** @format */
import crypto from 'crypto';
import { cacheInstance, removeSession } from '../../../helpers/util-Cache.js';
import { generateJWTToken } from "../../../helpers/util-utilities.js";
import {
  createDoc,
  getDocs,
  updateDoc,
  deleteDoc
} from '../../../helpers/factoryFN.js';
import { validateUser, User } from '../model/user.js';
import { _responseWrapper } from '../../../helpers/util-response.js';
import { sendEmail, isValidEmail } from '../../../utils/email.js';
import { baseUrlGenerator } from '../../../middleware/fileUploadMiddleware.js';
import { validTokenStr } from '../../../middleware/authenticationMiddleware.js';
import config from '../../../config.js';
let { URL } = config;
import ejs from 'ejs';
import path from 'path';
import { createAllergies } from '../../allergies/controller/allergies.js';
import { createDietary } from '../../dietary/controller/dietary.js';


const createDataFN = {
  allergies: createAllergies,
  dietaries: createDietary
};

const handleCustomData = async (req) => {
  for (let [key, value] of Object.entries(req.body)) {
    if (key.startsWith('custom_')) {
      let newKey = key.replace('custom_', '');
      if (!createDataFN[newKey]) {
        throw new Error(`Unsupported custom field: ${key}`);
      }
      if (Array.isArray(value)) {
        req.body[newKey] = req.body[newKey] || [];
        for (const item of value) {
          const data = await createDataFN[newKey]({
            ...req,
            body: { name: item }
          });
          if (data.success) {
            req.body[newKey].push(data.data._id.toString());
          } else {
            throw new Error(`Failed to create ${newKey}: ${item}`);
          }
        }
      } else if (typeof value === 'string') {
        const data = await createDataFN[newKey]({
          ...req,
          body: { name: value }
        });
        if (data.success) {
          req.body[newKey] = data.data._id.toString();
        } else {
          throw new Error(`Failed to create ${newKey}: ${value}`);
        }
      } else {
        throw new Error(`Invalid type for custom field: ${key}`);
      }

      delete req.body[key];
    }
  }
};


// Get user routes
export const getUser = async req => {
  return await getDocs(User, {
    populate: [
      {
        path: 'subRole',
        select: 'title',
        model: 'SubRole'
      }
    ]
  })(req);
};

export const updateUser = async (req) => {
  try {
    const { avatar } = req.files || {};
    await handleCustomData(req);

    const { ...updateData } = req.body;



    // Update avatar if provided
    if (avatar) {
      updateData.avatar = baseUrlGenerator('single', avatar[0])?.url;
    }

    // Build the update fields
    const updateFields = {
      $set: updateData,
    };

    // Construct the final update object
    const updateObject = { update: updateFields };

    // Apply remaining updates
    const updateResponse = await updateDoc(User, {
      updateObject, populate: [
        {
          path: 'subRole',
          select: 'title',
          model: 'SubRole'
        }
      ]
    })(req);

    return updateResponse;
  } catch (error) {
    console.error('Error in updateUser:', error);
    return _responseWrapper(false, error.message, 500);
  }
};


export const updateFCMTokens = async req => {
  try {
    const { addfcmToken, removefcmToken } = req.body;
    const { _id } = req.user;
    // Update the user document
    const updateFields = {};
    if (addfcmToken) {
      updateFields.$addToSet = { FCMTokens: addfcmToken };
    }
    if (removefcmToken) {
      updateFields.$pull = { FCMTokens: removefcmToken };
    };
    const updateObject = {
      query: { _id },
      update: updateFields
    };

    // Apply the update
    const updateResponse = await updateDoc(User, { updateObject })(req);

    return updateResponse;
  } catch (error) {
    console.error('Error in addFCMTokens:', error);
    return _responseWrapper(false, error.message, 500);
  }
};


export const getAllUsers = async req => {
  let { subRole, restaurant, name } = req.query;
  const user = req.user._id

  const query = {};

  // Base conditions
  const conditions = [
    { _id: { $ne: user } }
  ];
  if (subRole) conditions.push({ subRole });
  if (restaurant) conditions.push({ restaurant });

  // Name search condition
  if (name) {
    const nameParts = name.trim().split(' ');
    if (nameParts.length === 1) {
      conditions.push({
        $or: [
          { firstName: { $regex: nameParts[0], $options: 'i' } },
          { lastName: { $regex: nameParts[0], $options: 'i' } }
        ]
      });
    } else {
      const firstName = nameParts[0];
      const lastName = nameParts[nameParts.length - 1];
      conditions.push({
        $and: [
          { firstName: { $regex: firstName, $options: 'i' } },
          { lastName: { $regex: lastName, $options: 'i' } }
        ]
      });
    }
  }

  // Combine all conditions with $and
  if (conditions.length > 0) {
    query.$and = conditions;
  }

  return await getDocs(User, {
    query,
    populate: [
      {
        path: 'subRole',
        select: 'title',
        model: 'SubRole'
      },
    ]
  })(req);
}


export const deleteUser = deleteDoc(User);


// Login User
export const login = async req => {
  try {
    if (req.body.email) {
      req.body.email = req.body.email.toLowerCase();
    }

    const { email, password, accessToken } = req.body;
    if (!(email) || (!accessToken && !password)) return _responseWrapper(true, 'Required fields missing', 400);
    if (!isValidEmail(email)) return _responseWrapper(true, 'Invalid email format', 400);

    const query = { email };
    const restParams = {
      query,
      findMethod: 'FindOneWithRefs',
      returnDoc: true,
      select: '+password',
    };

    const { data: user, status } = await getDocs(User, restParams)(req);
    if (!status) return _responseWrapper(false, 'Something went wrong', 200);
    if (!user) return _responseWrapper(false, 'Invalid Credentials', 200);

    // Verify the password
    if (!accessToken) {
      const verifyPwd = await user.verifyPassword(password, user.password);
      if (!verifyPwd) return _responseWrapper(false, 'Invalid Credentials', 200);
    }

    // Generate the token for the user
    const token = await generateJWTToken(user);


    user.password = undefined; // Exclude sensitive data
    user.isDeleted = undefined;
    user.__v = undefined;

    return _responseWrapper(true, 'Login successful', 200, { data: { token, user } });
  } catch (e) {
    console.log("Login Error:", e);
    return _responseWrapper(false, e.message, 500);
  }
};

// Signup User
export const signup = async req => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return _responseWrapper(true, 'Required fields missing', 400);
    if (!isValidEmail(email)) return _responseWrapper(true, 'Invalid email format', 400);

    req.body['avatar'] = "https://res.cloudinary.com/dpwjczplx/image/upload/v1730810741/default_avatar.png";


    await handleCustomData(req);

    const user = await createDoc(User, {
      returnDoc: true,
      validateFN: validateUser,
    })(req);

    if (user.error?.code === 11000) {
      return _responseWrapper(false, 'Email already exists.', 200);
    }

    if (!user.success) {
      return _responseWrapper(
        false,
        user.message || 'User creation failed.',
        user.statusCode || 500
      );
    }

    return login(req);

    // return _responseWrapper(true, 'User created successfully', 201, { data: user.data });
  } catch (error) {
    console.error('Signup Error:', error);
    return _responseWrapper(false, error.message, 500);
  }
}

export const checkEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return _responseWrapper(false, 'Email required', 400);
    if (!isValidEmail(email)) return _responseWrapper(false, 'Invalid email format', 400);

    const user = await getDocs(User,
      {
        query: { email }
      }
    )(req);

    if (user.success && user.data.length > 0) {
      return _responseWrapper(true, 'Email already exists.', 200);
    } else {
      const otpResponse = await sendOTP(req);
      if (!otpResponse.success) return otpResponse;
      
      return _responseWrapper(false, 'Email not found.', 200);

    }
  } catch (error) {
    console.error('Error:', error);
    return _responseWrapper(false, error.message, 500);
  }
};


export const createUser = async (req) => {
  try {
    const { documents, avatar } = req.files || {};
    const { email } = req.body;

    // Generate document URLs if files are provided
    if (documents) {
      req.body.documents = baseUrlGenerator('multiple', documents);
    }
    if (avatar) {
      req.body.avatar = baseUrlGenerator('single', avatar[0])?.url;
    } else {
      // Set default avatar if none provided
      req.body.avatar = "https://res.cloudinary.com/dpwjczplx/image/upload/v1730810741/default_avatar.png";
    }

    // Generate a random password if not provided
    if (!req.body.password) {
      req.body.password = crypto.randomBytes(4).toString('hex');
    }

    const { password } = req.body;

    // Create the user document
    const user = await createDoc(User, {
      returnDoc: true,
      validateFN: validateUser,
    })(req);
    console.log("user", user);

    // Handle specific errors and responses
    if (user.error?.code === 11000) {
      return _responseWrapper(false, 'Email already exists.', 200);
    }

    if (!user.success) {
      return _responseWrapper(false, user.error.message, 400);
    }

    // Send a welcome email
    await sendEmail({
      to: email,
      subject: 'Welcome to the Ready to dine Family!',
      text: `
        Welcome to the Ready to Dine Family! 
        Here are your credentials to log in:
        Email: ${email}
        Password: ${password}`,
    });

    return user;
  } catch (error) {
    console.error('Signup Error:', error);
    return _responseWrapper(false, error.message, 500);
  }
};


// Logout User
export const logout = async req => {
  const { authorization: apiToken } = req.headers;
  if (apiToken) {
    await removeSession(cacheInstance["session-cache"], validTokenStr(apiToken));
    return _responseWrapper(true, "Logout successful", 200);
  }
  return _responseWrapper(false, "Authorization token is required", 401);
};

// Forgot Password
export const forgotPassword = async req => {
  try {
    const { email } = req.body;

    if (!isValidEmail(email)) return _responseWrapper(false, 'Invalid email format', 200);

    // Find and validate user
    const { data: user, status } = await getDocs(User, {
      query: { email },
      findMethod: 'FindOne',
      returnDoc: true
    })(req);

    if (!status || !user) {
      return _responseWrapper(false, 'Email Not Found', 200);
    }

    const token = await user.generatePwdResetToken();
    await user.save({ validateBeforeSave: false });

    let resetLink = `${URL}/user/resetpassword?token=${token}`;

    const emailTemplate = await ejs.renderFile(
      path.join(path.resolve(), 'views/passwordResetEmail.ejs'),
      { resetLink }
    );


    // Send OTP email
    await sendEmail({
      to: email,
      subject: 'Password Reset link',
      text: ``,
      html: emailTemplate,
    });

    return _responseWrapper(true, 'Email has been sent successfully', 200);
  } catch (error) {
    console.error('Forgot Password Error:', error);
    return _responseWrapper(true, error.message, 400);
  }
};


// Render Reset Password
export const RenderResetPassword = async (req, res) => {
  try {
    const { token } = req.query;
    const encryptedToken = crypto.createHash('sha256').update(token).digest('hex');
    const { data: user, status } = await getDocs(User, {
      query: { passwordResetToken: encryptedToken },
      findMethod: 'FindOne',
      returnDoc: true
    })(req);

    if (!status || !user) {
      return res.render('inValidToken');
    }


    res.render('reset-password', { token });
  } catch (error) {
    console.error('Render Reset Password Error:', error);
    return res.status(400).send('Invalid or expired token');
  }
};


// Reset Password
export const resetPassword = async (req, res) => {
  try {
    const { newPassword, token } = req.body;

    const encryptedToken = crypto.createHash('sha256').update(token).digest('hex');
    const { data: user, status } = await getDocs(User, {
      query: { passwordResetToken: encryptedToken },
      findMethod: 'FindOne',
      returnDoc: true
    })(req);

    if (!status || !user) {
      return res.render('inValidToken');
    }

    // Update password
    user.password = newPassword;
    user.passwordResetToken = undefined;
    await user.save();

    return res.render('passwordResetSuccess');
  } catch (error) {
    console.error('Reset Password Error:', error);
    return res.status(400).send('Invalid or expired token');
  }
};

// Update Password
export const updatePassword = async req => {
  try {
    const { _id } = req.user;
    const { currentPassword, newPassword } = req.body;

    let { data: user, status } = await getDocs(User, {
      query: { _id },
      returnDoc: true,
      select: '+password'
    })(req);
    user = user[0];

    if (!status || !user) {
      return _responseWrapper(false, 'Invalid user', 200);
    }

    const verifyPassword = await user.verifyPassword(currentPassword, user.password);
    if (!verifyPassword) {
      return _responseWrapper(false, 'Current password is incorrect', 200);
    }

    user.password = newPassword;
    await user.save();

    const token = await generateJWTToken(user);
    return _responseWrapper(true, 'Password updated successfully', 200, { data: { token } });
  } catch (error) {
    console.error('Update Password Error:', error);
    return _responseWrapper(false, error.message, 400);
  }
};

// Send OTP
export const sendOTP = async req => {
  try {
    const { email } = req.body;
    if (!isValidEmail(email)) return _responseWrapper(false, 'Invalid email format', 200);

    const otp = Math.floor(100000 + Math.random() * 900000);

    // Store OTP in cache for 2 minutes
    cacheInstance['session-cache'].instance.set(email, otp);
    setTimeout(() => cacheInstance['session-cache'].instance.del(email), 2 * 60 * 1000);

    await sendEmail({
      to: email,
      subject: 'OTP Verification',
      text: `Your OTP is ${otp}`,
    });

    return _responseWrapper(true, 'OTP sent successfully', 200, { data: { otp } });
  } catch (error) {
    console.error('Send OTP Error:', error);
    return _responseWrapper(false, error.message, 400);
  }
};


export const verifyOTP = async req => {
  try {
    const { email, otp } = req.body;
    if (!otp) {
      return _responseWrapper(false, 'OTP is required', 400);
    }

    if (!email ) {
      return _responseWrapper(false, 'Email is required', 400);
    }

    if (!isValidEmail(email)) {
      return _responseWrapper(false, 'Invalid email format', 400);
    }

    const storedOTP = cacheInstance['session-cache'].instance.get(email);

    if (!storedOTP) {
      return _responseWrapper(false, 'OTP expired', 400);
    }

    if (Number(otp) !== storedOTP) {
      return _responseWrapper(false, 'Invalid OTP', 400);
    }
    // Remove OTP after verification
    cacheInstance['session-cache'].instance.del(email);

    return _responseWrapper(true, 'OTP verified successfully', 200);
  } catch (error) {
    console.error('Verify OTP Error:', error);
    return _responseWrapper(false, error.message, 500);
  }
};
