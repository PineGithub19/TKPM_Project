import { Request, Response, NextFunction } from 'express';
import { videoPublishHistoryService } from '../services/VideoPublishHistoryService/VideoPublishHistory.service';

class VideoPublishHistoryController {
    public async getAllExportedVideos(req: Request, res: Response, next: NextFunction) {
        try {
            const videos = await videoPublishHistoryService.getExportedVideos();
            res.status(200).json({ videos });
        } catch (error) {
            res.status(500).json({ error: 'Cannot get exported videos' });
        }
    }

    public async deleteExportedVideo(req: Request, res: Response, next: NextFunction) {
        const { videoId } = req.params;
        try {
            const result = await videoPublishHistoryService.deleteExportedVideo(videoId);
            if (result) {
                res.status(200).json({ message: 'Video deleted successfully' });
            } else {
                res.status(404).json({ error: 'Video not found' });
            }
        } catch (error) {
            res.status(500).json({ error: 'Cannot delete video' });
        }
    }
}

export default VideoPublishHistoryController;
