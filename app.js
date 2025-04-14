/* eslint-disable global-require */
/**
 * Created by hassan.Raza on 02/09/2024.
 */
/*--------------------INITIAL SETUP--------------------*/
import dotenv from 'dotenv';
import path from 'path';
import express from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import device from 'express-device';
import { restoreCache } from './helpers/util-Cache.js';
import('./bin/database.js'); // Import the database connection

dotenv.config({ path: path.join(path.resolve(), '.env') }); //'./config.env'

const app = express();
const router = express.Router();
const apiVersion = 'v1';

/*--------------------GENERAL MIDDLEWARE--------------------*/
app.use(cors());
app.use(helmet());
app.use(logger('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.set('view engine', 'ejs');
app.use(express.static(path.join(path.resolve(), 'public')));
app.use('/.well-known', express.static(path.join(path.resolve(), 'public/.well-known')));
app.use(device.capture());
app.use(compression());
app.disable('x-powered-by'); // Disable X-Powered-By to hide express version

/*--------------------BASE ROUTE--------------------*/
app.get('/', (req, res) => {
    res.send('Server is started');
});

/*--------------------RESTORE CACHE--------------------*/
restoreCache();

/*--------------------ROUTES CONFIG--------------------*/
app.use(`/${apiVersion}`, router);

// CORS and Headers Setup for API Responses
router.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header(
        'Access-Control-Allow-Headers',
        'Authorization, Origin, X-Requested-With, Content-Type, Accept, Cache-Control'
    );

    // Get IP address from the request
    req.userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress.split(':').pop();
    req.userIp = req.userIp === '127.0.0.1' ? '' : req.userIp;

    next();
});

// Delay to load routes
setTimeout(() => {
    import('./routes/index.js').then(({ default: routes }) => routes(router)); // Load the routes
}, 1000);

/*--------------------EXPORT MODULES--------------------*/
export { apiVersion, app };
