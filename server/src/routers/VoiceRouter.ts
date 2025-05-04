import { Router } from 'express';
import { VoiceController, uploadVoiceMiddleware } from '../controllers/VoiceController';
import path from 'path';
import fs from 'fs';

const router = Router();
const voiceController = new VoiceController();

// Đảm bảo thư mục voices tồn tại
const voicesDir = path.join(process.cwd(), 'public', 'voices');
if (!fs.existsSync(voicesDir)) {
    fs.mkdirSync(voicesDir, { recursive: true });
}

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

// Thêm route mới để upload file voice
router.post('/upload', uploadVoiceMiddleware, (req, res) => {
    voiceController.uploadVoice(req, res);
});

router.get('/get-voices', voiceController.getVoices);

export default router;
