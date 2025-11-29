Auth Microservice
Auth Microservice

[![node](https://img.shields.io/badge/node-%3E%3D16-brightgreen)](https://nodejs.org/)

Lightweight authentication service built with Express, MongoDB (Mongoose), and JWT. It provides registration, login/logout, current-user lookup, and address management for authenticated users. Tests run in isolation using an in-memory MongoDB and an in-memory Redis mock so they do not touch production services.

---

## Table of contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Environment variables](#environment-variables)
- [Installation](#installation)
- [Run](#run)
- [Tests](#tests)
- [API reference](#api-reference)
- [Data model](#data-model)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

---

## Features

- Secure user registration and login (bcrypt)
- JWT-based authentication (cookie + `Authorization: Bearer <token>` support)
- Logout with cookie clearing and optional Redis-based token blacklist
- Get current authenticated user
- Add / delete / list user addresses

## Prerequisites

- Node.js 16+
- npm or yarn
- MongoDB (local or Atlas) for development

## Environment variables

Create a `.env` file inside the `Auth/` folder with at least:

```
MONGODB_URI=mongodb://localhost:27017/aibuddy-auth
PORT=3000
jwtSecret=change_this_to_a_secure_secret
# Optional Redis
# REDIS_HOST=127.0.0.1
# REDIS_PORT=6379
# REDIS_PASSWORD=
```

Notes:
- The current code reads the JWT secret as `process.env.jwtSecret` (case-sensitive). It's common to use `JWT_SECRET`; you can either set `jwtSecret` as above or rename the env var in code.
- `server.js` in this repo currently starts on port `3000` (literal) — see Troubleshooting for recommended change to pick `process.env.PORT`.

## Installation

```powershell
cd Auth
npm install
```

## Run

Start the server (current behavior):

```powershell
node server.js
```

Development (auto-restart):

```powershell
npm run dev
```

Note: If you prefer `npm start`, add a `start` script to `package.json` such as `"start": "node server.js"`.

## Tests

Run the test suite (Jest + Supertest):

```powershell
npm test
```

If Jest reports open handles, use `--detectOpenHandles` to help diagnose: `npm test -- --detectOpenHandles`.

## API reference

Base path: `/api/auth`

All endpoints accept and return JSON. Protected endpoints require either the HttpOnly `token` cookie or an `Authorization: Bearer <token>` header.

### POST /api/auth/register

- Registers a new user.
- Body example:

```json
{
  "username": "jsmith",
  "email": "jsmith@example.com",
  "password": "secret123",
  "fullName": { "firstName": "John", "lastName": "Smith" }
}
```

- Response: `201` with `{ message, user }` (password omitted)

### POST /api/auth/login

- Log in with email or username + password.
- Body example:

```json
{ "email": "jsmith@example.com", "password": "secret123" }
```

- Response: `200` and sets an HttpOnly `token` cookie

### GET /api/auth/logout

- Clears the authentication cookie and (optionally) blacklists the token in Redis
- Response: `200`

### GET /api/auth/me

- Returns the current authenticated user
- Response: `200` with `{ message, user }`

### GET /api/auth/users/me/addresses

- Lists addresses for the authenticated user
- Response: `200` with `{ addresses: [...] }`

### POST /api/auth/users/me/addresses

- Add a new address
- Body example:

```json
{ "street":"123 Main St","city":"Town","state":"TS","country":"Country","zip":"12345","isDefault":true }
```

- Response: `200` (or `201`)

### DELETE /api/auth/users/me/addresses

- Delete addresses by ID
- Body example:

```json
{ "addressIds": ["<id1>", "<id2>"] }
```

- Response: `200` with updated `addresses` array

## Data model

See `src/models/user.model.js`.

Highlights:

- `username`, `email` — unique
- `password` — hashed (not returned by API)
- `fullNanme` — schema field currently spelled `fullNanme` (typo). Validators and controllers accept `fullName` on input; consider renaming the schema field to `fullName` to avoid confusion.
- `address` — array of `{ street, city, state, country, zip, isDefault }`

## Troubleshooting

- `connectDB is not a function`: Check how `src/db/db.js` is imported. The module exports `connectDB` and `closeDB` as named exports; ensure `require('./src/db/db')` matches the usage in `server.js`.

- `MongoParseError` or warnings about connection options: Modern Mongoose does not require `useNewUrlParser` or `useUnifiedTopology`. Remove those options and use `await mongoose.connect(mongoUri)`.

- Cookie not set in browser: controllers set the cookie with `secure: true`. On plain `http://localhost` browsers will not accept secure cookies. For local testing either run the server over HTTPS or change the cookie option in development.

- Server starts before DB connection: current `server.js` starts the HTTP server on port `3000` then calls `connectDB()`. This may allow requests to reach the server before DB is ready — recommended change: call `await connectDB()` and only then `app.listen(process.env.PORT || 3000)`.

## Contributing

- Add tests under `__tests__/` for new endpoints and behaviors
- Keep API compatibility where possible
- Document any new environment variables in this README

---

If you want, I can apply safe code fixes now:

- Update `server.js` to await DB connection and respect `process.env.PORT`
- Remove deprecated mongoose options in `src/db/db.js`
- Add a `start` script to `package.json`

Tell me which of these you'd like me to apply and I will patch the repo and run the tests.