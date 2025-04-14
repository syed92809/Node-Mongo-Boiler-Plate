// util-response.js

import _ from 'lodash';

const ResponseWrapper = (status, message, statusCode, data = {}) => {
  let _res = {
    status_code: statusCode,
    message: message,
    success: status,
  };

  if (data && data.data && data.data.token) {
    _res.token = data.data.token;
    delete data.data.token;
  }

  if (message === 'requiredAll') _res.message = 'Please fill all the required fields';
  if (message === 'emailErr') _res.message = 'Please Provide a valid email address';
  if (message === 'fetchSuccess') _res.message = 'Fetched successfully';
  if (message === 'createSuccess') _res.message = 'Created successfully';
  if (message === 'updateSuccess') _res.message = 'Updated successfully';
  if (message === 'removeSuccess') _res.message = 'Removed successfully';
  if (message === 'alreadyExist') _res.message = 'Data already exists';
  if (message === 'alreadyExistPin') _res.message = 'One post is already pinned';
  if (message === 'EmailNotSend') _res.message = 'Something went wrong';
  if (message === 'LoginSuccess') _res.message = 'User Login Successfully';
  if (message === 'notFound') _res.message = 'Data not found';

  if ((data && Object.keys(data).length) || Array.isArray(data)) {
    _res.data = data.data;
    if (data.data.length && data.count) _res.count = data.count;
  }

  return _res;
};

const DataOmit = (data, omitArray) => {
  data.data = _.omit(data.data.toObject(), omitArray);
  return data;
};

const _res = (rest = {}) => {
  const {
    status = false,
    message = 'Authorization header or token is missing.',
    code = 401,
    res
  } = rest;

  res.status(code).json({
    status_code: code,
    message,
    success: status
  });
};

// module.exports = {
//   _responseWrapper: ResponseWrapper,
//   _dataOmit: DataOmit,
//   _res
// };

export {
  ResponseWrapper as _responseWrapper,
  DataOmit as _dataOmit,
  _res
}