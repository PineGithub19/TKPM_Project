import express from 'express';
import InformationController from '../controllers/InformationController';

const informationController = new InformationController();

const router = express.Router();

router.post('/create', informationController.createNewImagePrompt);
router.delete('/delete', informationController.deleteImagePrompt);

export default router;
