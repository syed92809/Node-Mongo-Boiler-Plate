/** @format */

import Joi from 'joi';

export default {
    createdBy: Joi.string().meta({
        _mongoose: { type: 'ObjectId', ref: 'User' }
    }),
    createdAt: Joi.date().default(Date.now),
    isDeleted: Joi.boolean().default(false),
    updatedAt: Joi.date()
};
