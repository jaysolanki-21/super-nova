const request = require('supertest');
const app = require('../src/app');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { connectDB, closeDB } = require('../src/db/db');
const mongoose = require('mongoose');
const User = require('../src/models/user.model');

let mongoServer;

beforeAll(async () => {
  // ensure jwt secret is available for controller when tests run
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

describe('POST /api/auth/register', () => {
  test('registers a new user and stores a hashed password', async () => {
    const payload = {
      username: 'testuser',
      email: 'a@b.com',
      password: 'secret123',
      fullName: { firstName: 'John', lastName: 'Doe' },
    };

    const res = await request(app).post('/api/auth/register').send(payload);
    expect(res.statusCode).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(payload.email);
    expect(res.body.user.password).toBeUndefined();

    // assert DB record (include password which is select:false on the schema)
    const userInDb = await User.findOne({ email: payload.email }).select('+password').lean();
    expect(userInDb).not.toBeNull();
    expect(userInDb.username).toBe(payload.username);
    // password must be hashed (not equal to plain)
    expect(userInDb.password).toBeDefined();
    expect(userInDb.password).not.toBe(payload.password);
    // model uses `fullNanme` field; controller accepts `fullName`
    expect(userInDb.fullNanme).toBeDefined();
    expect(userInDb.fullNanme.firstName).toBe(payload.fullName.firstName);
  });

  test('rejects duplicate user (same email or username)', async () => {
    const payload = {
      username: 'testuser2',
      email: 'b@b.com',
      password: 'secret123',
      fullName: { firstName: 'Jane', lastName: 'Doe' },
    };

    const r1 = await request(app).post('/api/auth/register').send(payload);
    expect(r1.statusCode).toBe(201);

    const r2 = await request(app).post('/api/auth/register').send(payload);
    expect(r2.statusCode).toBe(409);
    expect(r2.body.message).toMatch(/exists/i);
  });

  test('returns detailed validation errors for bad payload', async () => {
    const payload = { username: 'x', email: 'not-an-email', password: '1', fullName: { firstName: '', lastName: '' } };
    const res = await request(app).post('/api/auth/register').send(payload);
    expect(res.statusCode).toBe(400);
    expect(Array.isArray(res.body.errors)).toBe(true);

    const msgs = res.body.errors.map(e => e.msg);
    expect(msgs).toEqual(expect.arrayContaining([
      'username must be at least 3 chars',
      'valid email required',
      'password min length 6',
      'fullName.firstName and fullName.lastName are required',
    ]));
  });
});
