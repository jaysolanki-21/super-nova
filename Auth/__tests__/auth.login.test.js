const request = require('supertest');
const app = require('../src/app');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { connectDB, closeDB } = require('../src/db/db');
const mongoose = require('mongoose');
const User = require('../src/models/user.model');
const bcrypt = require('bcryptjs');

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

describe('POST /api/auth/login', () => {
  test('logs in a user with valid credentials', async () => {
    const user = {
      username: 'testuser',
      email: 'testuser@example.com',
      password: 'password123',
      fullNanme: { firstName: 'Test', lastName: 'User' },
    };

    // Create user directly in the database
    const hashedPassword = await bcrypt.hash(user.password, 10);
    await User.create({ ...user, password: hashedPassword });

    const payload = {
      email: user.email,
      password: user.password,
    };

    const res = await request(app).post('/api/auth/login').send(payload);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Login successful');
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(user.email);
    expect(res.body.user.username).toBe(user.username);
    expect(res.body.user.role).toBe('user');
  });

  test('rejects login with invalid email', async () => {
    const payload = {
      email: 'nonexistent@example.com',
      password: 'password123',
    };

    const res = await request(app).post('/api/auth/login').send(payload);
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });

  test('rejects login with incorrect password', async () => {
    const user = {
      username: 'testuser',
      email: 'testuser@example.com',
      password: 'password123',
      fullNanme: { firstName: 'Test', lastName: 'User' },
    };

    // Create user directly in the database
    const hashedPassword = await bcrypt.hash(user.password, 10);
    await User.create({ ...user, password: hashedPassword });

    const payload = {
      email: user.email,
      password: 'wrongpassword',
    };

    const res = await request(app).post('/api/auth/login').send(payload);
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });
});