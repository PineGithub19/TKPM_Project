import express from 'express';
import LiteratureController from '../controllers/LiteratureController';

const router = express.Router();
const literatureController = new LiteratureController();

router.get('/wikipedia', literatureController.searchWikipedia);

export default router; 