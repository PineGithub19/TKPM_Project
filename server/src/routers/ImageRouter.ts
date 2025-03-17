import express from 'express';
import ImageController from '../controllers/ImageController';

const imageController = new ImageController();
const router = express.Router();

router.post('/text-to-image', imageController.handleTextToImage);
router.post('/image-to-text', imageController.handleImageToText);

export default router;
