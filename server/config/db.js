const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/lpg_inventory';

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
      family: 4, // Force IPv4 to prevent IPv6 DNS resolution timeouts on cloud hosts like Render
    });
    
    console.log(`[MongoDB] Connected successfully to ${conn.connection.host}`);
  } catch (err) {
    console.error(`[MongoDB Error] Failed to connect to MongoDB Atlas (${err.message})`);
    console.error('Please verify your MONGO_URI environment variable and MongoDB Atlas Network Access IP.');
    process.exit(1);
  }
};

module.exports = connectDB;
