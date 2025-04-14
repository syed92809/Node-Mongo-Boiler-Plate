/* eslint-disable guard-for-in */
/* eslint-disable no-await-in-loop */
/* eslint-disable import/no-unresolved */
/* eslint-disable node/no-missing-require */

import NodeCache from 'node-cache';
import CacheDB from '../src/cache/controller/cache.js'; // Ensure the path and file extension are correct
import jwtHelper from './util-jwt.js';
import config from '../config.js'; // Ensure the path and file extension are correct
const { AUTH } = config;

const sessionCache = new NodeCache({ stdTTL: 0, checkperiod: 0 });

global.sessionCache = sessionCache;

export const cacheInstance = {
    'session-cache': {
        title: 'session-cache',
        instance: sessionCache
    },
};

/*
 * =====================================================================
 * ------------------------ UTIL CACHE METHODS -------------------------
 * =====================================================================
 * */

export const getSession = async (cache, key) => {
    const cacheResponse = await cache.instance.get(key);
    if (!cacheResponse) {
        console.log(`${cache.title}: Key not Found!`);
        return null;
    }
    return cacheResponse;
};

export const removeSession = async (cache, key) => {
    const removeResponse = await cache.instance.del(key);

    if (removeResponse) {
        await CacheDB.removeCacheFN(key);
        console.log(`${cache.title}: Session Expire Successfully.`);
        return true;
    }
    console.log(`${cache.title}: Operation failed, cache not exists. ${removeResponse}`);
    return false;
};

const addSession = async (cache, token, id) => {
    const cacheAdded = cache.instance.set(token, id);
    if (cacheAdded) {
        const cacheCreated = await CacheDB.addCacheFN(cache.title, token, id);
        if (cacheCreated.status)
            console.log(`${cache.title}: ${cacheCreated.message}`);
        else
            console.log(`${cache.title}: ${cacheCreated.message}`);
    }
};

const sessionKeys = () => {
    sessionCache.keys((err, mykeys) => {
        if (!err) {
            console.log('cache Keys: ', mykeys);
        }
    });
};

// Refresh token cache socket
const refreshTokenCache = (data, rootCallback) => {
    const isExpired = jwtHelper.verifyToken(data.accessToken);
    if (!isExpired) {
        const newToken = jwtHelper.generateToken(
            { registerId: data.userId },
            AUTH.jwt.expiresIn
        );
        addSession(cacheInstance['session-cache'], newToken, data.userId);
        data.accessToken = newToken;
        rootCallback(data);
    }
};

// Restore Cache
export const restoreCache = async () => {
    const cached = await CacheDB.getCacheFN();
    if (cached.success) {
        const { data } = cached;
        for (const i in data) {
            const jwt = await jwtHelper.verifyToken(data[i].key);
            if (!jwt) await CacheDB.removeCacheFN(data[i].key);
            await cacheInstance[data[i].instance].instance.set(
                data[i].key,
                data[i].value
            );
        }
        console.log('Cache Restored Successfully');
    }
};

// Direct Cache Functions
const removeFromSession = (key, callback) => {
    sessionCache.del(key, (err, res) => {
        if (!err) {
            callback(null, res);
        } else {
            callback(err, null);
        }
    });
};

/*
 * =====================================================================
 * ------------------------- UTIL CACHE EVENTS -------------------------
 * =====================================================================
 * */


/**
 * @event expired - sessionCache
 * @description Fired when a key expires. Will return the key and value as callback argument.
 * */
sessionCache.on('expired', (key, value) => {
    CacheDB.removeCacheFN(key, () => {
        // success
    });
});

export default {
    cacheInstance,
    initSession: addSession,
    getSession,
    removeSession,
    sessionKeys,
    restoreCache,
    refreshTokenCache,
    removeFromSessionCache: removeFromSession
};
