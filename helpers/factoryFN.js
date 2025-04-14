/* eslint-disable prefer-const */
/** @format */

import _ from 'lodash';
import mongoose, { Types } from 'mongoose';
import GenericProcedure from './util-generic-functions.js';
const { _basePost, _baseFetch, _basePut, _baseRemove } = GenericProcedure;
import { _responseWrapper } from './util-response.js';

const validateObjId = id => Types.ObjectId.isValid(id);
const handleFiles = (files, body) => {
  body.media = files.media;
  return body;
};

const excludePut = ['__v', 'id', 'createdBy', 'media'];
const excludePost = ['__v', 'id'];

// eslint-disable-next-line no-return-assign
const contAggQuery = (agg, _id) => {
  if (agg[0].$match) agg[0].$match._id = new mongoose.Types.ObjectId(_id);
  else agg.unshift({ $match: { _id: new mongoose.Types.ObjectId(_id) } });
  return agg;
};

// creating the controller
export const createDoc = (Model, rest = {}) => async req => {
  try {
    const { returnDoc, populate = {}, insertMany, validateFN = () => { } } = rest;
    const { error } = validateFN(req.body);

    if (error) return _responseWrapper(false, error.details[0].message, 400);

    const varToPick = _.keys(Model.schema.tree).filter(
      el => !excludePost.includes(el)
    );
    const { body } = req;
    body.createdBy = req.user && req.user._id;

    let doc = await _basePost(Model, _.pick(body, varToPick), insertMany);

    doc['success'] = doc.status;

    if (doc.status && Object.keys(populate).length) {
      let pop = await Model.populate(doc.data, populate);
      if (pop) {
        doc.data = pop;
      }
    }

    if (returnDoc) return doc;
    return errOrSuccessHandler(req, Model, 'createSuccess', doc);
  } catch (error) {
    console.log(error);
  }
};

// *? Getting Single/All the currency controller
export const getDocs = (Model, rest = {}) => async req => {
  req.params = req.params || {};
  req.query = req.query || {};
  let {
    params: { id, slug },
    query: { skip = 0, limit = 20 }
  } = req;

  const {
    agg,
    query = {},
    populate,
    returnDoc,
    select = '-__v -isDeleted ',
    sort = { createdAt: -1 },
    single = false
  } = {
    ...rest
  };

  let { findMethod } = rest;
  const args = {
    query: agg || { isDeleted: false, ...query },
    extra: { skip: +skip, limit: +limit },
    parameterToGet: select,
    populate,
    sort
  };

  //set method type
  if (!findMethod)
    findMethod =
      (agg && 'Aggregate') ||
      (populate && 'FindWithPopulate') ||
      'FindWithCount';

  if (id || slug) {
    if (id) {
      const isValid = validateObjId(id);
      if (!isValid) return _responseWrapper(false, 'invalidId', 400);
      id = new Types.ObjectId(id);
      if (agg) args.query = contAggQuery(agg, id);
      if (id) args.query._id = id;
    }

    if (slug) args.query.slug = slug;
    if (!agg)
      findMethod = (populate && (id || slug) && 'FindOneWithRefs') || 'FindOne';
  }
  if (single) {
    args.extra.skip = 0;
  }
  const doc = await _baseFetch(Model, args, findMethod);

  if (single) {
    if (doc.data.length > 0) {
      doc.data = doc.data[0];
    }
  }

  if (doc.status) {
    doc['success'] = true;
  }

  if (returnDoc) return doc;
  return errOrSuccessHandler(null, null, 'fetchSuccess', doc);
};

// creating the controller
// agg => aggregation
export const updateDoc = (Model, params = {}) => async req => {
  req.params = req.params || {};
  req.query = req.query || {};
  const {
    params: { id },
    body,
    files
  } = req;
  const { updateObject = {}, returnDoc, populate } = params;

  const { _id } = updateObject.query || {};

  const isValid = validateObjId(id || _id);

  if ((id || _id) && !isValid) return _responseWrapper(false, 'invalidId', 400);

  const varToPick = _.keys(Model.schema.tree).filter(
    el => !excludePut.includes(el)
  );

  if (varToPick.includes('lastUpdated')) body.lastUpdated = new Date();

  const query = updateObject.query ? updateObject.query : {};
  let isDeleted = varToPick.includes('isDeleted');
  isDeleted = isDeleted ? { isDeleted: false } : {};

  const args = {
    query: { ...isDeleted, ...query },
    updateObject: !_.isEmpty(updateObject)
      ? updateObject.update
      : _.pick(body, [...varToPick, "$push", "$inc", "$pull", "$set"]),
    parameterToGet: '-__v'
  };
  if (id || _id) args.query._id = id || _id;

  args.populate = populate || '';
  const doc = await _basePut(Model, args, 'findOneAndUpdate');

  if (returnDoc) return doc;
  return errOrSuccessHandler(req, Model, 'updateSuccess', doc);
};

// creating the controller
export const deleteDoc = (Model, rest = {}) => async req => {
  const {
    params: { id }
  } = req;

  const {
    query,
    removeType,
  } = {
    ...rest
  };

  const isValid = validateObjId(id);
  if (!isValid) return _responseWrapper(false, 'invalidId', 400);

  const args = { query: query || { _id: id }, removeObject: { isDeleted: true } };

  const doc = await _baseRemove(Model, args, removeType);

  return errOrSuccessHandler(req, Model, 'deleteSuccess', doc);
};

export const errOrSuccessHandler = (req, Model, msg, doc) => {
  let statusCode;
  let action;

  if (!doc.status && doc.error.code === 11000) return _responseWrapper(false, doc.error.message, 409);
  if (!doc.status) return _responseWrapper(false, doc.error.message, 400);
  if (!doc.data && !doc.error) return _responseWrapper(false, 'notFound', 404);

  switch (msg) {
    case 'fetchSuccess':
      statusCode = 200;
      break;
    case 'createSuccess':
      statusCode = 201;
      action = 'Created';
      break;
    case 'updateSuccess':
      statusCode = 200;
      action = 'Updated';
      break;
    case 'deleteSuccess':
      statusCode = 200;
      action = 'Deleted';
      break;
    case 'error':
      statusCode = 204;
      break;
    default:
      statusCode = 500;
  }

  return _responseWrapper(statusCode === 500 ? false : true, msg, statusCode, doc);
};

export const handleAggResult = result => {
  const data = _.get(result, "data[0].data", _.get(result, "data[0]", false));
  const count = _.get(result, "data[0].metadata[0].count", 0);
  return _responseWrapper(true, "fetchSuccess", 200, {
    data, count,
  });
};
