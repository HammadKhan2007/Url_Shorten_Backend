import express from 'express';
import { shortenUrl, redirectToLongUrl, getAllUrls, generateQrCode } from '../controllers/urlController.js';

const router = express.Router();

// POST /api/shorten - Naya URL shorten karne ke liye
router.post('/shorten', shortenUrl);

// GET /api/urls - Saare ya recent URLs fetch karne ke liye (frontend list ke liye)
router.get('/urls', getAllUrls); // Route changed to /api/urls for clarity

// POST /api/qrcode - QR code generate karne ke liye
router.post('/qrcode', generateQrCode);

// Dynamic redirection route: Ye sabse last mein hona chahiye
// Taki doosre /api routes pehle process ho sakein.
// Ye tab trigger hoga jab URL base_url/urlCode format ka ho.
router.get('/:urlCode', redirectToLongUrl);

export default router;