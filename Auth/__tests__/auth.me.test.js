const request = require('supertest');
const app = require('../src/app');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { connectDB, closeDB } = require('../src/db/db');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../src/models/user.model');

let mongoServer;

beforeAll(async () => {
  process.env.jwtSecret = process.env.jwtSecret || 'test_jwt_secret';
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await connectDB(uri);
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await closeDB();
  if (mongoServer) await mongoServer.stop();
});

describe('GET /api/auth/me', () => {
  test('returns user details for authenticated user', async () => {
    const user = {
      username: 'testuser',
      email: 'testuser@example.com',
      password: 'password123',
      fullNanme: { firstName: 'Test', lastName: 'User' },
    };

    // Create user directly in the database
    const newUser = await User.create(user);

    // Generate a valid JWT token
    const token = jwt.sign({ id: newUser._id, username: newUser.username, role: newUser.role }, process.env.jwtSecret, { expiresIn: '1d' });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.username).toBe(user.username);
    expect(res.body.user.email).toBe(user.email);
    expect(res.body.user.role).toBe('user');
  });

  test('returns 401 if no token is provided', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('Unauthorized');
  });

  test('returns 401 for invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalidtoken');

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('Unauthorized');
  });
});