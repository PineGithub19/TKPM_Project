import express from 'express';
import VideoPublishHistoryController from '../controllers/VideoPublishHistoryController';

const videoPublishHistoryController = new VideoPublishHistoryController();
const router = express.Router();

router.get('/all', (req, res, next) => {
    videoPublishHistoryController.getAllExportedVideos(req, res, next);
});

router.delete('/:videoId', (req, res, next) => {
    videoPublishHistoryController.deleteExportedVideo(req, res, next);
});

export default router;
