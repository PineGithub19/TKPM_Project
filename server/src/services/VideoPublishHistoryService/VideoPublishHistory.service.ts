import * as DBService from '../../services/DBServices';
import VideoPublishHistory from '../../models/VideoPublishHistory';
import Video from '../../models/Video';
import ImageConfig from '../../models/ImageConfig';
import LiteratureWork from '../../models/LiteratureWork';

class VideoPublishHistoryService {
    async getExportedVideos() {
        const videos = await DBService.getDocuments(VideoPublishHistory);
        const detailedVideoInformation = await Promise.all(
            videos.map(async (video) => {
                const videoDetails = await DBService.getDocumentById(Video, video.video_id.toString());
                let background = null;
                let title = '';
                if (videoDetails && videoDetails.image_config) {
                    const imageConfig = await DBService.getDocumentById(
                        ImageConfig,
                        videoDetails.image_config.toString(),
                    );
                    if (imageConfig && imageConfig.generated_images && imageConfig.generated_images.length > 0) {
                        background = imageConfig.generated_images[0];
                    }
                }
                if (videoDetails && videoDetails.literature_work_id) {
                    const literatureWork = await DBService.getDocumentById(
                        LiteratureWork,
                        videoDetails.literature_work_id.toString(),
                    );
                    if (literatureWork) {
                        title = literatureWork.title;
                    }
                }

                return { ...video.toObject(), title, background };
            }),
        );
        return detailedVideoInformation;
    }

    async deleteExportedVideo(videoId: string) {
        const video = await DBService.deleteDocumentById(VideoPublishHistory, videoId);
        return video;
    }
}

export const videoPublishHistoryService = new VideoPublishHistoryService();
