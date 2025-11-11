import mongoose from 'mongoose';
import dotenv from 'dotenv'; // .env variables load karne ke liye

dotenv.config(); // .env file load karein

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected Successfully!');
    } catch (err) {
        console.error('MongoDB connection error:', err.message);
        process.exit(1); // Error hone par process exit kar dein
    }
};

export default connectDB; // connectDB function ko export karein