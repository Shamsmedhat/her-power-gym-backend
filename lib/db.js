const mongoose = require('mongoose');

let isConnected = 0;
module.exports = async function connectDB(uri) {
  if (isConnected) return;
  const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  isConnected = conn.connections[0].readyState;
};
