import { Request, Response, NextFunction } from 'express';
import SlideshowGenerator from '../services/VideoService/SlideshowGenerator';
import * as DBService from '../services/DBServices';
import Video from '../models/Video';

class VideoController {
    public async createSlideshow(req: Request, res: Response, next: NextFunction) {
        const { config } = req.body;
        console.log('Received config:', config); // Log the received config for debugging
        if (!config) {
            return res.status(400).json({ error: 'Config is required' });
        }
        const slideshowGenerator = new SlideshowGenerator(config);
        try {
            const videoUrl = await slideshowGenerator.generate();
            res.status(200).json({ videoUrl });
        } catch (error) {
            next(error);
        }
    }

    public async getAllVideos(req: Request, res: Response, next: NextFunction) {
        try {
            const videos = await DBService.getDocuments(Video); // Assuming this method exists in your service
            res.status(200).json({ videos });
        } catch (error) {
            next(error);
        }
    }
}

export default VideoController;
