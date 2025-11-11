import Url from '../models/Url.js';
import generateShortId from '../utils/shortId.js';
import { redisClient } from '../config/redis.js'; // redisClient ko import karein
import qrcode from 'qrcode';
import { URL } from 'url'; // URL validation ke liye

// Shorten a URL
export const shortenUrl = async (req, res) => {
    const { longUrl, customAlias } = req.body;
    const baseUrl = process.env.BASE_URL;

    if (!longUrl) {
        return res.status(400).json({ error: 'Please provide a long URL.' });
    }

    // Basic URL validation
    try {
        new URL(longUrl); // Check if it's a valid URL format
    } catch (error) {
        return res.status(400).json({ error: 'Invalid URL format. Make sure it includes http:// or https://' });
    }

    try {
        let urlCode;

        if (customAlias) {
            // Validate custom alias length and format
            if (customAlias.length < 5 || !/^[a-zA-Z0-9_-]+$/.test(customAlias)) {
                return res.status(400).json({ error: 'Custom alias must be at least 5 characters and contain only letters, numbers, hyphens, or underscores.' });
            }
            // Check if custom alias is already in use in DB
            const existingUrlByAlias = await Url.findOne({ urlCode: customAlias });
            if (existingUrlByAlias) {
                return res.status(409).json({ error: 'Custom alias already in use.' });
            }
            urlCode = customAlias;
        } else {
            // Generate a unique short ID, ensure it's not already in use
            let unique = false;
            while (!unique) {
                const generatedCode = generateShortId();
                const existing = await Url.findOne({ urlCode: generatedCode });
                if (!existing) {
                    urlCode = generatedCode;
                    unique = true;
                }
            }
        }

        const shortUrl = `${baseUrl}/${urlCode}`;

        // Check if the long URL has already been shortened
        let url = await Url.findOne({ longUrl });

        if (url) {
            // Agar longUrl pehle se exist karta hai, toh existing shortened URL return karein
            return res.status(200).json(url); // Status 200 ok for existing resource
        } else {
            // Naya URL entry banayein
            url = new Url({
                longUrl,
                shortUrl,
                urlCode,
                date: new Date()
            });

            await url.save();

            // Redis mein cache karein (1 ghante ke liye)
            await redisClient.setEx(urlCode, 3600, longUrl); // 3600 seconds = 1 hour

            res.status(201).json(url); // Status 201 Created for new resource
        }
    } catch (err) {
        console.error('Error shortening URL:', err);
        res.status(500).json({ error: 'Server Error during URL shortening.' });
    }
};

// Redirect to original URL
export const redirectToLongUrl = async (req, res) => {
    const urlCode = req.params.urlCode;

    try {
        // Redis cache se lene ki koshish karein
        let longUrl = await redisClient.get(urlCode);

        if (longUrl) {
            // Click count MongoDB mein update karein (fire and forget for performance)
            // Ya Redis mein counter use karein aur periodically sync karein DB se
            Url.updateOne({ urlCode }, { $inc: { clicks: 1 } }).exec();
            return res.redirect(longUrl);
        } else {
            // Agar cache mein nahi hai, toh MongoDB se fetch karein
            const url = await Url.findOne({ urlCode });

            if (url) {
                // Redis mein cache karein future requests ke liye (1 ghante ke liye)
                await redisClient.setEx(urlCode, 3600, url.longUrl);
                // Click count update karein aur save karein
                url.clicks++;
                await url.save();
                return res.redirect(url.longUrl);
            } else {
                return res.status(404).json({ error: 'Short URL not found.' });
            }
        }
    } catch (err) {
        console.error('Error during redirection:', err);
        res.status(500).json({ error: 'Server Error during redirection.' });
    }
};

// Get all URLs (for display in user's dashboard/frontend list)
export const getAllUrls = async (req, res) => {
    try {
        // Latest URLs fetch karein (e.g., last 50)
        const urls = await Url.find().sort({ date: -1 }).limit(50);
        res.json(urls);
    } catch (err) {
        console.error('Error fetching all URLs:', err);
        res.status(500).json({ error: 'Server Error fetching URLs.' });
    }
};

// Generate QR Code for a short URL
export const generateQrCode = async (req, res) => {
    const { shortUrl } = req.body;

    if (!shortUrl) {
        return res.status(400).json({ error: 'Please provide a short URL.' });
    }

    try {
        const qrCodeDataUrl = await qrcode.toDataURL(shortUrl);
        res.json({ qrCode: qrCodeDataUrl });
    } catch (err) {
        console.error('Error generating QR code:', err);
        res.status(500).json({ error: 'Failed to generate QR code.' });
    }
};