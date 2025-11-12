import Url from '../models/Url.js';
import generateShortId from '../utils/shortId.js';
import { redisClient } from '../config/redis.js';
import qrcode from 'qrcode';
import { URL } from 'url';

export const shortenUrl = async (req, res) => {
    const { longUrl, customAlias } = req.body;
    const baseUrl = process.env.BASE_URL;

    if (!longUrl) {
        return res.status(400).json({ error: 'Please provide a long URL.' });
    }

    try {
        new URL(longUrl);
    } catch (error) {
        return res.status(400).json({ error: 'Invalid URL format. Make sure it includes http:// or https://' });
    }

    try {
        let urlCode;

        if (customAlias) {
            if (customAlias.length < 5 || !/^[a-zA-Z0-9_-]+$/.test(customAlias)) {
                return res.status(400).json({ error: 'Custom alias must be at least 5 characters and contain only letters, numbers, hyphens, or underscores.' });
            }
            const existingUrlByAlias = await Url.findOne({ urlCode: customAlias });
            if (existingUrlByAlias) {
                return res.status(409).json({ error: 'Custom alias already in use.' });
            }
            urlCode = customAlias;
        } else {
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

        let url = await Url.findOne({ longUrl });

        if (url) {
            return res.status(200).json(url);
        } else {
            url = new Url({
                longUrl,
                shortUrl,
                urlCode,
                date: new Date()
            });

            await url.save();

            await redisClient.setEx(urlCode, 3600, longUrl);

            res.status(201).json(url);
        }
    } catch (err) {
        console.error('Error shortening URL:', err);
        res.status(500).json({ error: 'Server Error during URL shortening.' });
    }
};

export const redirectToLongUrl = async (req, res) => {
    const urlCode = req.params.urlCode;

    try {
        let longUrl = await redisClient.get(urlCode);

        if (longUrl) {
            Url.updateOne({ urlCode }, { $inc: { clicks: 1 } }).exec();
            return res.redirect(longUrl);
        } else {
            const url = await Url.findOne({ urlCode });

            if (url) {
                await redisClient.setEx(urlCode, 3600, url.longUrl);
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

export const getAllUrls = async (req, res) => {
    try {
        const urls = await Url.find().sort({ date: -1 }).limit(50);
        res.json(urls);
    } catch (err) {
        console.error('Error fetching all URLs:', err);
        res.status(500).json({ error: 'Server Error fetching URLs.' });
    }
};

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