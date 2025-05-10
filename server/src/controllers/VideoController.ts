import { Request, Response, NextFunction } from 'express';
import SlideshowGenerator from '../services/VideoService/SlideshowGenerator';
import * as DBService from '../services/DBServices';
import VideoPublishHistory from '../models/VideoPublishHistory';
import Video from '../models/Video';
import LiteratureWork from '../models/LiteratureWork';
import path from 'path';

class VideoController {
    public async createSlideshow(req: Request, res: Response, next: NextFunction) {
        const { config, videoId } = req.body;
        console.log('Received config:', config, videoId); // Log the received config for debugging
        if (!config) {
            return res.status(400).json({ error: 'Config is required' });
        }
        const slideshowGenerator = new SlideshowGenerator(config);
        try {
            const videoUrl = await slideshowGenerator.generate();
            console.log('CHECK VIDEO URL COMPLETE IN BE: ', videoUrl);

            var finalUrl = '';
            if (videoUrl.outputWithMusicPath != null && videoUrl.outputWithMusicPath != 'No background music') {
                finalUrl = videoUrl.outputWithMusicPath;
            } else if (videoUrl.outputPath != null) finalUrl = videoUrl.outputPath;

            // Get the filename from the full path
            const filename = path.basename(finalUrl || '');

            console.log('CHECK VIDEO URL COMPLETE IN BE: ', filename);

            // Construct URL using PORT from environment variables
            const port = process.env.PORT || '3000';
            const outputUrl = `http://localhost:${port}/videos/${filename}`;

            if (videoId) {
                const existingHistory = await VideoPublishHistory.findOne({ videoId: videoId });
                if (!existingHistory) {
                    const videoPublishHistoryObject = {
                        video_id: videoId,
                        platform: 'YouTube',
                        video_url: outputUrl,
                        publish_date: new Date(),
                        is_uploaded: false,
                    };

                    await DBService.createDocument(VideoPublishHistory, videoPublishHistoryObject);
                } else {
                    existingHistory.video_url = outputUrl;
                    existingHistory.publish_date = new Date();

                    await DBService.updateDocument(VideoPublishHistory, videoId, existingHistory);
                }
            }

            res.status(200).json({ outputPath: outputUrl });
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

    public async searchVideos(req: Request, res: Response, next: NextFunction) {
        const { searchValue } = req.query;
        try {
            // Find all LiteratureWorks that match the search value in title, author, or genre
            const works = await LiteratureWork.find({
                $or: [
                    { title: { $regex: searchValue, $options: 'i' } },
                    { author: { $regex: searchValue, $options: 'i' } },
                    { genre: { $regex: searchValue, $options: 'i' } },
                ],
            }).select('_id');

            const workIds = works.map((w: any) => w._id);

            // Find videos whose literature_work_id is in the found works
            const videos = await Video.find({ literature_work_id: { $in: workIds } })
                .populate('literature_work_id')
                .populate('image_config')
                .exec();

            // Map to only return required fields
            const result = videos.map((video: any) => ({
                videoId: video._id,
                scriptId: video.literature_work_id._id,
                voiceId: video.voice_config,
                imageId: video.image_config._id,
                title: video.literature_work_id?.title,
                author: video.literature_work_id?.author,
                genre: video.literature_work_id?.genre,
                createdAt: video.createdAt
                    ? new Date(video.createdAt).toLocaleString('en-GB', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                      })
                    : '',
                background: video.image_config?.generated_images?.[0] || null,
                isFinished: video.is_finished,
            }));

            res.status(200).json({ videos: result });
        } catch (error) {
            next(error);
        }
    }
}

export default VideoController;
