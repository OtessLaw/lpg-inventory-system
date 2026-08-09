const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/lpg_inventory';

  try {
    // Standard Mongoose MongoDB Atlas connection
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
    });
    
    console.log(`[MongoDB] Connected successfully to ${conn.connection.host}`);
  } catch (err) {
    console.warn(`[MongoDB Warning] Primary connection error (${err.message}). Attempting TLS fallback connection...`);
    
    try {
      // Retry with explicit TLS options for cloud hosts like Render/Atlas
      const conn = await mongoose.connect(mongoURI, {
        serverSelectionTimeoutMS: 10000,
        tls: true,
        tlsAllowInvalidCertificates: true, // Prevents certificate validation failure on cloud platforms
      });
      console.log(`[MongoDB] Connected successfully via TLS to ${conn.connection.host}`);
    } catch (tlsErr) {
      console.warn(`[MongoDB Warning] TLS connection failed (${tlsErr.message}). Starting Mongo Memory Server fallback...`);
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        // Specify MongoDB v7.0.3+ for Debian 12 compatibility on Render
        const mongod = await MongoMemoryServer.create({
          binary: {
            version: '7.0.3',
          },
        });
        const uri = mongod.getUri();
        const conn = await mongoose.connect(uri);
        console.log(`[MongoDB Memory Server] Connected to in-memory database at ${conn.connection.host}`);
      } catch (memErr) {
        console.error('[MongoDB Error] Failed to connect to MongoDB:', memErr.message);
        process.exit(1);
      }
    }
  }
};

module.exports = connectDB;
