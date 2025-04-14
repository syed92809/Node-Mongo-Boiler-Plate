/* eslint-disable no-unused-vars */
/* eslint-disable no-shadow */
/**
 * Module dependencies.
 */
/*--------------------INCLUDE PACKAGES--------------------*/
import http from 'http';
import { Server as SocketIO } from 'socket.io';
import { app } from '../app.js';
import config from '../config.js';

const server = http.createServer(app);

/*--------------------SOCKET.IO--------------------*/
export const io = new SocketIO(server);
app.set('io', io);
import('../utils/socket.js').then(({ default: setupSocket }) => setupSocket(io));

/*--------------------PORT & LISTENING--------------------*/

// eslint-disable-next-line no-use-before-define
const port = normalizePort(config.PORT || '3001');

/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(port);
console.log('Server is listening on port:', port);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
    const port = parseInt(val, 10);

    // eslint-disable-next-line no-restricted-globals
    if (isNaN(port)) return val;

    if (port >= 0) return port;
    // port number

    return false;
}

export { port };
