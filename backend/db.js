// backend/db.js
require('dotenv').config();
const mongoose = require('mongoose');

async function connectMongo() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI missing in .env');

  await mongoose.connect(uri, {
    dbName: process.env.DB_NAME || 'wedding_db',
  });
  console.log('✅ Mongo connected:', mongoose.connection.host);
}

module.exports = { connectMongo, mongoose };
