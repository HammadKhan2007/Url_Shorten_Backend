import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import { connectRedis } from './config/redis.js';
import urlRoutes from './routes/urlRoutes.js';

dotenv.config();

const app = express();

connectDB();

await connectRedis();

app.use(express.json());
 app.use(cors({
    origin: 'https://url-shorten-blush-eta.vercel.app',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204
}));

app.use('/api', urlRoutes);

app.use('/', urlRoutes);


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));