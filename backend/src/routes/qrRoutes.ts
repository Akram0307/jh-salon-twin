import { Router, Request, Response } from 'express';
import QRCode from 'qrcode';

const router = Router();

// GET /api/qr/:payload
router.get('/:payload', async (req: Request, res: Response) => {
  try {
    const payload = String(req.params.payload);

    const qrBuffer = await QRCode.toBuffer(payload, {
      type: 'png',
      width: 300,
      margin: 2
    });

    res.setHeader('Content-Type', 'image/png');
    res.send(qrBuffer);

  } catch (error) {
    console.error('QR generation error:', error);
    res.status(500).json({ error: 'QR generation failed' });
  }
});

export default router;
