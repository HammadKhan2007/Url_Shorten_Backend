import { createClient } from 'redis'; // Redis client banane ke liye
import dotenv from 'dotenv';

dotenv.config(); // .env file load karein

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
    // Agar Redis client pehle se connected nahi hai, toh connect karein
    if (!redisClient.isOpen) {
        try {
            await redisClient.connect();
        } catch (err) {
            console.error('Failed to connect to Redis:', err.message);
            process.exit(1); // Error hone par process exit kar dein
        }
    }
};

export { redisClient, connectRedis }; // redisClient instance aur connectRedis function ko export karein