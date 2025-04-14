// eslint-disable import/no-unresolved
// eslint-disable node/no-missing-import
/**
 * Created by hassan.raza on 05/09/2024.
 * @file Cache Controller
 * Cache CURD Functions
 */

import mongoose from 'mongoose';
import { _responseWrapper } from '../../../helpers/util-response.js';
import { Cache, validateCache } from '../model/cache.js';
import GenericProcedure from '../../../helpers/util-generic-functions.js';

/*
 * =====================================================================
 * --------------------------- CACHE METHODS ---------------------------
 * =====================================================================
 */

/**
 * @name @addCacheFN
 * @description add new cache into db for restoring purpose
 * @requires instance(String) key(String) value(String)
 */
export const addCacheFN = async (instance, key, value) => {
    if (key && value) {
        const args = {
            key: key,
            value: value,
            instance: instance,
        };

        const newCache = await GenericProcedure._basePost(Cache, args);

        if (!newCache.status)
            return _responseWrapper(false, newCache.error.message, 400);
        return _responseWrapper(true, 'Cache added successfully!', 201, newCache);
    }
    return _responseWrapper(false, 'requiredAll', 400);
};

/**
 * @name @removeCacheFN
 * @description remove cache from db
 * @requires key(String),value(string)
 */
export const removeCacheFN = async (key) => {
    if (key) {
        const args = {
            query: {
                key: key,
            },
        };

        const removedCacheObject = await GenericProcedure._baseRemove(
            Cache,
            args,
            'HardRemove'
        );
        if (!removedCacheObject.status)
            return _responseWrapper(false, removedCacheObject.error.message, 400);

        return _responseWrapper(true, 'Cache removed successfully!', 204);
    }
    return _responseWrapper(false, 'requiredAll', 400);
};

/**
 * @name @getCacheFN
 * @description get all cache for restore purpose
 * @requires none
 */
export const getCacheFN = async () => {
    const args = {
        query: {},
        parameterToGet: 'key value instance',
    };

    const allCache = await GenericProcedure._baseFetch(Cache, args);
    if (!allCache.status)
        return _responseWrapper(false, allCache.error.message, 400);
    return _responseWrapper(true, 'fetchSuccess', 200, allCache);
};

/**
 * @name @removeAllUserCachesFN
 * @description remove session cache keys for a specific userId
 * @requires userId
 */
export const removeAllUserCachesFN = async (userId) => {
    const args = {
        query: {
            instance: 'session-cache',
            'value._id': mongoose.Types.ObjectId(userId),
        },
        parameterToGet: 'key',
    };

    const cacheFind = await GenericProcedure._baseFetch(Cache, args);

    if (!cacheFind.status)
        return _responseWrapper(false, cacheFind.error.message, 400);

    const sessionKeys = cacheFind.data.map((item) => item.key);

    const session = await global.sessionCache.del(sessionKeys);
    if (session) {
        console.log('All user session caches removed successfully!');
    } else {
        console.log('error', session);
    }
};

export default {
    addCacheFN,
    removeCacheFN,
    getCacheFN,
    removeAllUserCachesFN,
};
