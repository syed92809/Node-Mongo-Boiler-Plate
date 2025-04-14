import {verifyToken} from "../helpers/util-jwt.js"

let clientRef = new Map();
global.clientRef = clientRef;

export default (io) => {
    io.on('connection', (socket) => {
        console.log('A user connected:', socket.id);

        // Handle disconnection
        socket.on('disconnect', () => {
            clientRef.delete(socket.id); // Remove the entry using socket.id
            console.log(`User disconnected: ${socket.id}`);
        });
    });
};
