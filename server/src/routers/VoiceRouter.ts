import { Router } from 'express';
import { VoiceController } from '../controllers/VoiceController';

const router = Router();
const voiceController = new VoiceController();

router.post('/generate', async (req, res) => {
  try {
    const voicePath = await voiceController.generateVoice(req.body);
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
