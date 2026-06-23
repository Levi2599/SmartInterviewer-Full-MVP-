require('dotenv').config();
const mongoose = require('mongoose');

async function clearDatabase() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/smartinterviewer';
  try {
    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    for (const coll of collections) {
      console.log('Dropping collection:', coll.name);
      await db.collection(coll.name).deleteMany({}); // clear documents
    }
    console.log('All collections cleared. Database is now empty.');
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error clearing database:', err);
    process.exit(1);
  }
}

clearDatabase();
