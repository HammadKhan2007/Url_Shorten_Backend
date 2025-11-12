import express from 'express';
import { shortenUrl, redirectToLongUrl, getAllUrls, generateQrCode } from '../controllers/urlController.js';

const router = express.Router();

router.post('/shorten', shortenUrl);

router.get('/urls', getAllUrls);

router.post('/qrcode', generateQrCode);

router.get('/:urlCode', redirectToLongUrl);

export default router;