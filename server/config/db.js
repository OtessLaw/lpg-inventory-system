const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/lpg_inventory';
    
    // Attempt standard connection with 3-second timeout for local instance
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 3000,
    });
    
    console.log(`[MongoDB] Connected successfully to ${conn.connection.host}`);
  } catch (err) {
    console.warn(`[MongoDB Warning] Primary connection failed (${err.message}). Starting Mongo Memory Server fallback...`);
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      const conn = await mongoose.connect(uri);
      console.log(`[MongoDB Memory Server] Connected to in-memory database at ${conn.connection.host}`);
    } catch (memErr) {
      console.error('[MongoDB Error] Failed to initialize Mongo Memory Server:', memErr.message);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
