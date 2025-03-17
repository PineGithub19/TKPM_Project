import express from 'express';
import VideoController from '../controllers/VideoController';

const videoController = new VideoController();
const router = express.Router();

export default router;
