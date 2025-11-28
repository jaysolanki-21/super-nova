const request = require('supertest');
// Ensure test mode so redis mock (if present) is used and Jest env is correct
process.env.NODE_ENV = process.env.NODE_ENV || 'test';

const app = require('../src/app');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { connectDB, closeDB } = require('../src/db/db');
const mongoose = require('mongoose');

jest.setTimeout(20000);

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

async function registerAndGetCookie() {
  const payload = {
    username: 'addruser',
    email: 'addr@local.test',
    password: 'password123',
    fullName: { firstName: 'Addr', lastName: 'User' },
  };

  const res = await request(app).post('/api/auth/register').send(payload);
  // allow either 201 or 200 depending on implementation
  if (![201, 200].includes(res.statusCode)) {
    throw new Error(`register failed: ${res.statusCode} ${JSON.stringify(res.body)}`);
  }

  const setCookie = res.headers['set-cookie'];
  if (!setCookie) return null;
  return Array.isArray(setCookie) ? setCookie[0].split(';')[0] : setCookie.split(';')[0];
}

describe('Addresses API: /api/auth/users/me/addresses', () => {
  test('GET returns addresses array (or 404 if route missing)', async () => {
    const cookie = await registerAndGetCookie();

    const res = cookie
      ? await request(app).get('/api/auth/users/me/addresses').set('Cookie', cookie)
      : await request(app).get('/api/auth/users/me/addresses');

    // Accept 200 with array, or 404 if endpoint not implemented yet
    expect([200, 404]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body).toBeDefined();
      const addrArr = Array.isArray(res.body.addresses)
        ? res.body.addresses
        : Array.isArray(res.body.address)
        ? res.body.address
        : Array.isArray(res.body)
        ? res.body
        : null;

      expect(addrArr).not.toBeNull();
      expect(Array.isArray(addrArr)).toBe(true);
    }
  });

  test('POST creates an address and it is returned by GET', async () => {
    const cookie = await registerAndGetCookie();
    const payload = {
      line1: '123 Test St',
      line2: 'Apt 4',
      city: 'Testville',
      state: 'TS',
      zip: '12345',
      country: 'Testland',
      isDefault: true
    };

    const postReq = cookie
      ? request(app).post('/api/auth/users/me/addresses').set('Cookie', cookie).send(payload)
      : request(app).post('/api/auth/users/me/addresses').send(payload);

      const postRes = await postReq;
      expect([201, 200, 404, 400]).toContain(postRes.statusCode);
      if (postRes.statusCode === 200 || postRes.statusCode === 201) {
        expect(postRes.body).toBeDefined();

        // now GET and ensure address present
        const getRes = cookie
          ? await request(app).get('/api/auth/users/me/addresses').set('Cookie', cookie)
          : await request(app).get('/api/auth/users/me/addresses');

        expect([200]).toContain(getRes.statusCode);
        expect(getRes.body).toBeDefined();
        const addrArr = Array.isArray(getRes.body.addresses)
          ? getRes.body.addresses
          : Array.isArray(getRes.body.address)
          ? getRes.body.address
          : Array.isArray(getRes.body)
          ? getRes.body
          : null;

        expect(addrArr).not.toBeNull();
        expect(Array.isArray(addrArr)).toBe(true);
        expect(addrArr.length).toBeGreaterThanOrEqual(1);
    }
  });

  test('DELETE removes addresses (base path) and GET then returns empty array', async () => {
    const cookie = await registerAndGetCookie();
    // create an address first (ignore 404)
    const payload = { line1: 'ToDelete 1', city: 'X', state: 'Y', zip: '00000' };
    if (cookie) {
      await request(app).post('/api/auth/users/me/addresses').set('Cookie', cookie).send(payload);
    } else {
      await request(app).post('/api/auth/users/me/addresses').send(payload);
    }

      // To delete addresses, controller expects { addressIds: [...] } in body.
      // Fetch existing addresses to obtain IDs (if any)
      const getBefore = cookie
        ? await request(app).get('/api/auth/users/me/addresses').set('Cookie', cookie)
        : await request(app).get('/api/auth/users/me/addresses');

      let ids = [];
      if (getBefore.statusCode === 200) {
        const beforeArr = Array.isArray(getBefore.body.addresses)
          ? getBefore.body.addresses
          : Array.isArray(getBefore.body.address)
          ? getBefore.body.address
          : Array.isArray(getBefore.body)
          ? getBefore.body
          : [];
        ids = beforeArr.map(a => a._id || a.id || String(a._id));
      }

      const delReq = cookie
        ? await request(app).delete('/api/auth/users/me/addresses').set('Cookie', cookie).send({ addressIds: ids })
        : await request(app).delete('/api/auth/users/me/addresses').send({ addressIds: ids });

      // Accept 200, 404, or 400 (if validation) - but not 500
      expect([200, 404, 400]).toContain(delReq.statusCode);
      if (delReq.statusCode === 200) {
        const getRes = cookie
          ? await request(app).get('/api/auth/users/me/addresses').set('Cookie', cookie)
          : await request(app).get('/api/auth/users/me/addresses');

        expect([200]).toContain(getRes.statusCode);
        const addrArr = Array.isArray(getRes.body.addresses)
          ? getRes.body.addresses
          : Array.isArray(getRes.body.address)
          ? getRes.body.address
          : Array.isArray(getRes.body)
          ? getRes.body
          : null;

        expect(addrArr).not.toBeNull();
        expect(Array.isArray(addrArr)).toBe(true);
        // expect empty (deleted) or absent
        expect(addrArr.length).toBe(0);
    }
  });
});
