import { Router } from 'express';
import { VoiceController } from '../controllers/VoiceController';

const router = Router();
const voiceController = new VoiceController();

router.post('/generate', async (req, res) => {
    try {
        const { promptId, text, tone, language } = req.body;
        const data = { text, tone, language };
        const voicePath = await voiceController.generateVoice(data, promptId);
        res.json({ success: true, path: voicePath });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

router.post('/generate-srt', async (req, res) => {
    try {
        const voicePath = await voiceController.generateSRTVoice(req.body);
        res.json({ success: true, path: voicePath });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

router.get('/get-voices', voiceController.getVoices);

export default router;
