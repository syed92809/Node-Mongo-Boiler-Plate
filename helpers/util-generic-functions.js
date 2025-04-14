// util-db.js

import config from '../config.js';
const { AUTH } = config;
import mongoose from 'mongoose';

/**
 * DB Find
 *
 * @param {object} model Contain DB model of the requested Object
 * @param {object} args
 *   An object containing:
 *      -query:
 *      -parameter:
 *
 */

const dbFindOne = async (model, args) =>
  await model
    .findOne(args.query, args.parameterToGet)
    .then(data => ({
      status: true,
      data
    }))
    .catch(error => ({
      status: false,
      error
    }));

const dbFind = async (model, args) => {
  return await model
    .find(args.query, args.parameterToGet)
    .sort(args.sort)
    .then(data => ({
      status: true,
      data
    }))
    .catch(error => ({
      status: false,
      error
    }));
};

const dbFindWithCount = async (model, args) => {
  return await model
    .find(args.query, args.parameterToGet)
    .limit(args.extra.limit)
    .skip(args.extra.skip)
    .sort(args.sort)
    .then(data => ({
      status: true,
      data
    }))
    .catch(error => ({
      status: false,
      error
    }));
};

const dbAggregate = async (model, args) =>
  await model
    .aggregate(args.query)
    .then(data => ({
      status: true,
      data
    }))
    .catch(error => ({
      status: false,
      error
    }));

const dbUpdateMany = async (model, args) =>
  await model
    .updateMany(args.query, args.updateObject)
    .then(data => ({
      status: true,
      data
    }))
    .catch(error => ({
      status: false,
      message: `Operation failed, error in updating ${model.modelName}`, //Get Model name from model
      error
    }));

const dbUpdate = async (model, args) =>
  await model
    .updateOne(args.query, args.updateObject, args.extra || {})
    .then(data => ({
      status: true,
      data
    }))
    .catch(error => ({
      status: false,
      message: `Operation failed, error in updating ${model.modelName}`, //Get Model name from model
      error
    }));

const dbFindOneAndUpdate = async (model, args) =>
  await model
    .findOneAndUpdate(args.query, args.updateObject, { new: true })
    .select(args.parameterToGet)
    .populate(args.populate)
    .then(data => ({
      status: true,
      data
    }))
    .catch(error => ({
      status: false,
      message: `Operation failed, error in updating ${model.modelName}`, //Get Model name from model
      error
    }));

const dbFindAndRemove = async (model, args) =>
  await model
    .findOneAndUpdate(args.query, args.removeObject, { new: true })
    .then(data => ({
      status: true,
      data
    }))
    .catch(error => ({
      status: false,
      message: `Operation failed, error in removing ${model.modelName}`, //Get Model name from model
      error
    }));

const dbFindAndHardRemove = async (model, args) =>
  await model
    .findOneAndDelete(args.query)
    .then(data => ({
      status: true,
      data
    }))
    .catch(error => ({
      status: false,
      message: `Operation failed, error in hard removing ${model.modelName}`, //Get Model name from model
      error
    }));

const dbRemoveMany = async (model, args) =>
  await model
    .deleteMany(args.query)
    .then(data => ({
      status: true,
      data
    }))
    .catch(error => ({
      status: false,
      message: `Operation failed, error in removing ${model.modelName}`, //Get Model name from model
      error
    }));

const dbInsertMany = async (model, data) =>
  await model
    .insertMany(data)
    .then(resData => ({
      status: true,
      data: resData
    }))
    .catch(error => ({
      status: false,
      message: `Operation failed, error in inserting ${model.modelName}`, //Get Model name from model
      error
    }));

const dbInsert = async (Model, data) => {
  const modelObject = new Model(data);
  return await modelObject
    .save()
    .then(resData => ({
      status: true,
      message: `${Model.modelName} data saved successfully`,
      _id: resData._id,
      data: resData
    }))
    .catch(error => ({
      status: false,
      error
    }));
};

const dbFindWithPopulate = async (model, args, methodType) =>
  await model[methodType](args.query, args.parameterToGet)
    .populate(args.populate)
    .limit(args.extra.limit)
    .skip(args.extra.skip)
    .sort(args.sort)
    .then(data => ({
      status: true,
      data
    }))
    .catch(error => ({
      status: false,
      error
    }));

const CountRequest = async (model, args) =>
  await model
    .countDocuments(args.query)
    .then(data => ({
      status: true,
      data
    }))
    .catch(error => ({
      status: false,
      message: `Operation failed, error while getting count from ${model.modelName}`, //Get Model name from model
      error
    }));

const userResponse = (res, object) => {
  if (object && object.status_code) {
    res.status(object.status_code).send(object);
  } else {
    res.send(object);
  }
};

export const routesHandler = fn => (req, res, next) => {
  try {
    return fn(req, res, next).then(
      success => userResponse(res, success),
      err => userResponse(res, err)
    );
  } catch (err) {
    return userResponse(res, err);
  }
};

const FetchRequest = async (model, args, methodType = 'Find') => {
  try {
    if (methodType === 'Aggregate') {
      const response = await dbAggregate(model, args);
      return response;
    }

    if (methodType === 'FindOne') {
      const response = await dbFindOne(model, args);
      return response;
    } else if (methodType === 'FindWithCount') {
      const response = await dbFindWithCount(model, args);
      const count = await CountRequest(model, args);
      response.count = count.data;
      return response;
    } else if (methodType === 'FindOneWithRefs') {
      const response = await dbFindWithPopulate(model, args, 'findOne');
      const count = await CountRequest(model, args);
      response.count = count.data;
      return response;
    } else if (methodType === 'FindWithPopulate') {
      const response = await dbFindWithPopulate(model, args, 'find');
      const count = await CountRequest(model, args);
      response.count = count.data;
      return response;
    } else {
      const response = await dbFind(model, args);
      return response;
    }
  } catch (error) {
    console.log(error);
  }
};

/**
 * POST Request
 *
 * @param {object} model Contain DB model of the requested Object
 * @param {object} data Contain raw data object
 *
 */

const PostRequest = async (model, data, methodType = 'insert') =>
  methodType === 'insert'
    ? await dbInsert(model, data)
    : methodType === 'insertMany'
      ? await dbInsertMany(model, data)
      : null;

/**
 * PUT Request
 *
 * @param {object} model Contain DB Model of the requested Object
 * @param {object} args
 *   An object containing:
 *      -query:
 *      -updateObject:
 *
 *      ** Additional option in findOneAndUpdate
 *      -parameterToGet
 */
const PutRequest = async (model, args, methodType = 'update') =>
  methodType === 'update'
    ? await dbUpdate(model, args)
    : methodType === 'findOneAndUpdate'
      ? await dbFindOneAndUpdate(model, args)
      : methodType === 'updateMany'
        ? await dbUpdateMany(model, args)
        : null;

/**
 * REMOVE Request
 *
 * @param {object} model Contain DB Model of the requested Object
 * @param {object} args
 *   An object containing:
 *      -query:
 *      -removeObject:
 *
 */
const RemoveRequest = async (model, args, methodType) =>
  methodType === 'HardRemove'
    ? await dbFindAndHardRemove(model, args)
    : methodType === 'RemoveAll'
      ? await dbRemoveMany(model, args)
      : await dbFindAndRemove(model, args);


/**
 * Reference Validator
 * @param {string} modelName Model name
 * @returns {object} Validator object
 */

const referenceValidator = (modelName) => {
  return {
    validator: async function (value) {
      if (!value) return true;
      const exists = await mongoose.model(modelName).exists({ _id: value });
      return exists !== null;
    },
    message: `Invalid ${modelName} ID. The ${modelName} does not exist.`,
  };
};


export default {
  _baseFetch: FetchRequest,
  _basePost: PostRequest,
  _basePut: PutRequest,
  _baseCount: CountRequest,
  _baseRemove: RemoveRequest,
  routesHandler,
  referenceValidator: referenceValidator
};
