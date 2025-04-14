/** @format */
import Joi from 'joi';
import mongoose from 'mongoose';
import joigoose from 'joigoose';
import baseSchema from '../../baseSchema.js';

const { Schema, model } = mongoose;
const { convert } = joigoose(mongoose);

const joiCacheSchema = Joi.object({
    instance: Joi.string().required(),
    key: Joi.string().required(),
    value: Joi.object().required(),
    ...baseSchema,
});

let cacheSchema = convert(joiCacheSchema);
cacheSchema = new Schema(cacheSchema);

const Cache = model('Cache', cacheSchema);

const validateCache = (cache) => joiCacheSchema.validate(cache);

export {
    Cache,
    validateCache,
};
