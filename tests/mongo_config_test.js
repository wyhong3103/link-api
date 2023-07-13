const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongoServer;
const connect = async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  mongoose.connect(mongoUri);
}

const clearDatabase = async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
       const collection = collections[key];
       await collection.deleteMany({});
    }
}

const closeDatabase = async () => {
   await mongoose.connection.dropDatabase();
   await mongoose.connection.close();
   await mongoServer.stop();
}

module.exports = {
    connect,
    closeDatabase,
    clearDatabase
}