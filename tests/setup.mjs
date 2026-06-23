import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

// Prefer in-memory MongoDB for tests. If USE_REAL_DB=true, fall back to MONGODB_URI.
const useRealDb = process.env.USE_REAL_DB === 'true';

beforeAll(async () => {
  if (useRealDb && process.env.MONGODB_URI) {
    await mongoose.connect(process.env.MONGODB_URI);
    return;
  }

  try {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  } catch (err) {
    // Fallback: tentar conectar ao MongoDB local / env
    console.warn('MongoMemoryServer failed, falling back to local MongoDB. Error:', err.message);
    const fallbackUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/seu_ze_seu_mane_test';
    await mongoose.connect(fallbackUri);
  }
}, 30000);

afterAll(async () => {
  // Clear DB and disconnect
  try {
    await mongoose.connection.dropDatabase();
  } catch (e) {
    // ignore
  }
  await mongoose.disconnect();

  if (mongoServer) {
    await mongoServer.stop();
  }
}, 30000);

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
