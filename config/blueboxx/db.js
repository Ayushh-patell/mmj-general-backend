// src/config/db.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const uri = process.env.MONGO_URI;
const HARD_FAIL = String(process.env.DB_HARD_FAIL || '').toLowerCase() === 'true';

function connectDB() {
  let result;

  return new Promise((resolve, reject) => {
    if (!uri) {
      const msg = 'MONGO_URI not set';
      if (HARD_FAIL) throw new Error(msg);
      console.warn('[DB] ' + msg + ' — continuing without DB');
      result = { connected: false };
      resolve(result);
      return;
    }

    mongoose.connect(uri, { serverSelectionTimeoutMS: 8000, socketTimeoutMS: 20000 }, (err) => {
      if (err) {
        console.error('❌ MongoDB connection error:', err?.message || err);
        if (HARD_FAIL) reject(err);
        else {
          console.warn('[DB] continuing without DB (temporary failure)');
          result = { connected: false };
        }
      } else {
        console.log('✅ MongoDB connected');
        result = { connected: true };
      }
      resolve(result);
    });
  });
}

function isDBConnected() {
  return mongoose.connection.readyState === 1;
}

function getMongoose() {
  return mongoose;
}

module.exports = { connectDB, isDBConnected, getMongoose };
