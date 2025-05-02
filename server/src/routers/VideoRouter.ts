import express from 'express';
import VideoController from '../controllers/VideoController';

const router = express.Router();
const videoController = new VideoController();

// Create a new slideshow video
router.post('/create', (req, res, next) => {
    videoController.createSlideshow(req, res, next);
});

router.get('/all', (req, res, next) => {
    videoController.getAllVideos(req, res, next);
});

router.get('/search', (req, res, next) => {
    videoController.searchVideos(req, res, next);
});

export default router;
