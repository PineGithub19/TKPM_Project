import { Router } from 'express';
import { VoiceController } from '../controllers/VoiceController';
import * as DBService from '../services/DBServices';
import VoiceConfig from '../models/VoiceConfig';

const router = Router();
const voiceController = new VoiceController();

router.post('/generate', async (req, res) => {
    try {
        const request = req.body;
        const voiceId = request.voiceId;
        const data = request.map((item: { promptId: string; text: string; tone?: string; language?: string }) => ({
            text: item.text,
            tone: item.tone,
            language: item.language,
        }));
        await DBService.updateDocument(VoiceConfig, voiceId, data);
        const voicePath = await voiceController.generateVoice(data);
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

export default router;
