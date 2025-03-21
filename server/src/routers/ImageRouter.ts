import express from 'express';
import ImageController from '../controllers/ImageController';

const imageController = new ImageController();
const router = express.Router();

router.get('/get-images', imageController.getImages);
router.post('/text-to-multiple-images', imageController.handleTextToMultipleImages);
router.post('/image-to-text', imageController.handleImageToText);

export default router;
