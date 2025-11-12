import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const redisClient = createClient({
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    }
});

redisClient.on('connect', () => console.log('Redis Connected Successfully!'));
redisClient.on('error', err => console.error('Redis Error:', err.message));

const connectRedis = async () => {
    if (!redisClient.isOpen) {
        try {
            await redisClient.connect();
        } catch (err) {
            console.error('Failed to connect to Redis:', err.message);
            process.exit(1);
        }
    }
};

export { redisClient, connectRedis };