import express from 'express';
import InformationController from '../controllers/InformationController';

const informationController = new InformationController();

const router = express.Router();

router.post('/create', informationController.createNewPrompt);
router.put('/update', informationController.updatePrompt);
router.delete('/delete', informationController.deletePrompt);

export default router;
