const redis = require("redis");
const client = redis.createClient({
    url: "redis://localhost:6379"
});

client.connect();

module.exports = {
    async set(key, value) {
        await client.set(key, JSON.stringify(value));
    },
    async get(key) {
        const data = await client.get(key);
        return data ? JSON.parse(data) : null;
    },
    async delete(key) {
        await client.del(key);
    }
};
