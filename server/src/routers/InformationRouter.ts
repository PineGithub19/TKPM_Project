import express from 'express';
import InformationController from '../controllers/InformationController';

const router = express.Router();
const informationController = new InformationController();

// Configure routes with appropriate middleware
router.post('/create', informationController.createNewImagePrompt);
router.put('/update', informationController.updateImagePrompt);
router.delete('/delete', informationController.deleteImagePrompt);

export default router;