/**
 * Tests: POST /api/products
 * - Unauthorized request
 * - Validation errors
 * - Invalid price
 * - Successful creation with uploaded image
 */

jest.mock('../src/models/product.model', () => {
  return jest.fn().mockImplementation(function (data) {
    Object.assign(this, data);
    this.save = jest.fn().mockResolvedValue(this);
  });
});

jest.mock('../src/services/imagekit.service', () => ({
  uploadImage: jest.fn(async () => ({
    url: 'https://example.com/image.jpg',
    thumbnailUrl: 'https://example.com/image-thumb.jpg',
    fileId: 'mock-file-id'
  }))
}));

const request = require('supertest');
const jwt = require('jsonwebtoken');

process.env.jwtSecret = 'testsecret';
const app = require('../src/app');

describe('POST /api/products', () => {
  const makeToken = (payload = { id: 'u1', username: 'seller1', role: 'seller' }) =>
    jwt.sign(payload, process.env.jwtSecret);

  // ----------------------------
  // 401 Unauthorized
  // ----------------------------
  test('should return 401 when no auth token provided', async () => {
    const res = await request(app).post('/api/products').send({});
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message');
  });

  // ----------------------------
  // 400 Missing required fields
  // ----------------------------
  test('should return 400 when required fields are missing', async () => {
    const token = makeToken();

    const res = await request(app)
      .post('/api/products')
      .set('Cookie', `token=${token}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');

    const params = res.body.errors.map(e => e.param || e.path);

    expect(params).toEqual(
      expect.arrayContaining(['title', 'priceAmount'])
    );
  });

  // ----------------------------
  // 400 Invalid price
  // ----------------------------
  test('should return 400 when priceAmount is invalid', async () => {
    const token = makeToken();

    const res = await request(app)
      .post('/api/products')
      .set('Cookie', `token=${token}`)
      .send({
        title: 'Valid Title',
        priceAmount: 'not-a-number'
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
    const params = res.body.errors.map(e => e.param || e.path);
    expect(params).toContain('priceAmount');
  });

  // ----------------------------
  // 201 Successful creation
  // ----------------------------
  test('should return 201 when valid data and image provided', async () => {
    const token = makeToken({
      id: '507f1f77bcf86cd799439011',
      username: 'seller1',
      role: 'seller'
    });

    const res = await request(app)
      .post('/api/products')
      .set('Cookie', `token=${token}`)
      .field('title', 'My Product')
      .field('description', 'Nice product')
      .field('priceAmount', '19.99')
      .field('priceCurrency', 'USD')
      .attach('images', Buffer.from('fakebytes'), 'image.jpg');

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('product');

    const product = res.body.product;

    expect(product).toHaveProperty('title', 'My Product');
    expect(product).toHaveProperty('price');
    expect(product.images).toBeInstanceOf(Array);
    expect(product.images[0]).toHaveProperty('url', 'https://example.com/image.jpg');
  });
});
