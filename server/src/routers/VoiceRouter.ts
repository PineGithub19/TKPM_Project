import { Router } from 'express';
import { VoiceController } from '../controllers/VoiceController';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();
const voiceController = new VoiceController();

// Đảm bảo thư mục voices tồn tại
const voicesDir = path.join(process.cwd(), 'public', 'voices');
if (!fs.existsSync(voicesDir)) {
    fs.mkdirSync(voicesDir, { recursive: true });
}

// Cấu hình multer để lưu file voice
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, voicesDir);
    },
    filename: function (req, file, cb) {
        cb(null, `voice_${Date.now()}${path.extname(file.originalname || '.mp3')}`);
    }
});

const upload = multer({ storage: storage });

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
router.post('/upload', upload.single('voice'), (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({ success: false, error: 'No file uploaded' });
            return;
        }
        
        // Trả về đường dẫn đến file đã upload
        const filePath = `/voices/${req.file.filename}`;
        res.json({ success: true, path: filePath });
    } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
    }
});

router.get('/get-voices', voiceController.getVoices);

export default router;
