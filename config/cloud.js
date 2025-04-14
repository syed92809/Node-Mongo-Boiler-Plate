import config from '../config.js';
const { CLOUD_NAME, CLOUD_API_KEY, CLOUD_API_SECRET } = config;
import cloudinary from 'cloudinary';

cloudinary.v2.config({
    cloud_name: CLOUD_NAME,
    api_key: CLOUD_API_KEY,
    api_secret: CLOUD_API_SECRET
});

export default {
    cloud: cloudinary.v2
};
