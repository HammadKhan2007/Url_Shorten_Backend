import mongoose from 'mongoose';

const urlSchema = new mongoose.Schema({
    longUrl: {
        type: String,
        required: true,
        trim: true
    },
    shortUrl: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    urlCode: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    clicks: {
        type: Number,
        default: 0
    }
});

const Url = mongoose.model('Url', urlSchema);

export default Url;