const mongoose = require('mongoose');

const testLocal = async () => {
  try {
    console.log("Testing Local MongoDB...");
    await mongoose.connect('mongodb://127.0.0.1:27017/spheronix_test');
    console.log("Local MongoDB Connected!");
    process.exit(0);
  } catch (e) {
    console.error("Local MongoDB Failed:", e.message);
    process.exit(1);
  }
};

testLocal();