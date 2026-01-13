const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri || !uri.includes("mongodb.net")) {
    console.error("❌ Invalid MongoDB Atlas URI");
    process.exit(1);
  }

  try {
    console.log("Attempting MongoDB Atlas connection...");
    const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4
    });

    console.log(`✅ MongoDB Atlas Connected Successfully: ${conn.connection.host}`);
    console.log(`🗄️ MongoDB Database Name: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Atlas Connection Failed: ${error.message}`);
    console.error("FULL ERROR DETAILS:", error);
    
    // STRICT MODE: No Fallback allowed as per user request
    console.error("❌ CRITICAL: Could not connect to MongoDB Atlas. Server stopping.");
    process.exit(1);
  }
};

module.exports = connectDB;