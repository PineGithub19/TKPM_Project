import express from 'express';
import VideoController from '../controllers/VideoController';

const router = express.Router();
const videoController = new VideoController();

// Create a new slideshow video
router.post('/create', (req, res, next) => {
    videoController.createSlideshow(req, res, next);
});

export default router;
