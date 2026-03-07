import { Router } from 'express';
import { handleIncomingMessage } from '../agents/receptionist';

const router = Router();

router.post('/', async (req, res) => {
    try {
        const { message, sender } = req.body;
        if (!message || !sender) {
            return res.status(400).json({ error: 'Message and sender are required' });
        }
        
        // handleIncomingMessage expects (sender, message)
        const responseText = await handleIncomingMessage(sender, message);
        res.json({ response: responseText });
    } catch (error) {
        console.error('Chat API Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
