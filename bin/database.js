/**
 * Created by hassan.raza on 05/09/2024.
 */

/*--------------------INCLUDE PACKAGES--------------------*/
import mongoose from 'mongoose';
import dbURI from '../config/db.js';

// console.log("dbURI", dbURI );

mongoose.Promise = global.Promise;

mongoose.connect(dbURI.url, {
  user: dbURI.user,
  pass: dbURI.password,
});

// Connection events
mongoose.connection.on('connected', () => {
  console.log(`Mongoose default connection open to ${dbURI.url}`);
});

// If the connection throws an error
mongoose.connection.on('error', (err) => {
  console.log(`Mongoose default connection error: ${err}`);
});

// When the connection is disconnected
mongoose.connection.on('disconnected', () => {
  console.log('Mongoose default connection disconnected');
});

// If the Node process ends, close the Mongoose connection
process.on('SIGINT', () => {
  mongoose.connection.close(() => {
    console.log('Mongoose default connection disconnected through app termination');
    process.exit(0);
  });
});
