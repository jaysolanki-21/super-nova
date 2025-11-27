// Avoid connecting to a real Redis instance during tests.
// When running under `NODE_ENV === 'test'` we export a lightweight in-memory mock.
if (process.env.NODE_ENV === 'test') {
    const store = new Map();
    const timers = new Map();

    const mock = {
        on: () => {},
        async set(key, value, ...args) {
            store.set(String(key), String(value));
            // handle optional EX ttl: set(key, value, 'EX', ttl)
            if (args && args.length >= 2) {
                const [opt, ttl] = args;
                if (String(opt).toUpperCase() === 'EX' && Number(ttl) > 0) {
                    if (timers.has(key)) clearTimeout(timers.get(key));
                    const t = setTimeout(() => {
                        store.delete(String(key));
                        timers.delete(String(key));
                    }, Number(ttl) * 1000);
                    timers.set(String(key), t);
                }
            }
            return 'OK';
        },
        async get(key) {
            return store.has(String(key)) ? store.get(String(key)) : null;
        },
        async del(key) {
            if (timers.has(String(key))) {
                clearTimeout(timers.get(String(key)));
                timers.delete(String(key));
            }
            return store.delete(String(key)) ? 1 : 0;
        },
        async quit() {
            for (const t of timers.values()) clearTimeout(t);
            timers.clear();
            store.clear();
            return 'OK';
        },
        async disconnect() {
            return this.quit();
        }
    };

    module.exports = mock;
} else {
    const { Redis } = require('ioredis');

    const redis = new Redis({
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        password: process.env.REDIS_PASSWORD,
    });

    redis.on('connect', () => {
        console.log('Connected to Redis server');
    });

    module.exports = redis;
}