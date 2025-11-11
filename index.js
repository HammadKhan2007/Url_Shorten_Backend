import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import { connectRedis } from './config/redis.js'; // connectRedis function ko import karein
import urlRoutes from './routes/urlRoutes.js';

// Environment variables load karein
dotenv.config();

const app = express();

// MongoDB se connect karein
connectDB();

// Redis se connect karein
// Ensure Redis client connects before any routes use it
await connectRedis(); // await use karein connection ka wait karne ke liye

// Middleware
app.use(express.json()); // JSON request body parse karne ke liye
app.use(cors()); // CORS enable karein (frontend se communication ke liye)

// API Routes
// /api prefix ke neeche URL shortening aur listing routes mount karein
app.use('/api', urlRoutes);

// Redirection Route: Ye sabse last mein hona chahiye
// Taki koi bhi aur API route isse clash na kare.
// Ye route base_url/urlCode pattern ko handle karega.
app.use('/', urlRoutes);


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));