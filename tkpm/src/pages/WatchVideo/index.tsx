import { useEffect, useState } from 'react';
import clsx from 'clsx';
import FloatingParticles from '../CreateVideo/CreateVideoComponents/FloatingParticles/FloatingParticles';
import styles from './WatchVideo.module.css';
import * as request from '../../utils/request';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';

interface VideoResult {
    id: string;
    videoId: string;
    platform: string;
    videoUrl: string;
    publishDate: string;
    isUploaded: boolean;
    title: string;
    background: string;
}

function WatchVideos() {
    const [videos, setVideos] = useState<VideoResult[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [videoUrl, setVideoUrl] = useState('');

    useEffect(() => {
        const fetchExportedVideos = async () => {
            const response = await request.get('/video_publish_history/all');

            if (response.videos) {
                const formattedVideos = response.videos.map((video: any) => ({
                    id: video._id,
                    videoId: video.video_id,
                    platform: video.platform,
                    videoUrl: video.video_url,
                    publishDate: new Date(video.publish_date).toLocaleDateString(),
                    isUploaded: video.is_uploaded,
                    title: video.title,
                    background: video.background,
                }));
                setVideos(formattedVideos);
            }
        };

        fetchExportedVideos();
    }, [videos.length]);

    const handleClickVideo = (videoUrl: string) => {
        setShowModal(true);
        setVideoUrl(videoUrl);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setVideoUrl('');
    };

    const handleDeleteVideo = async (event: React.MouseEvent<SVGSVGElement>, videoId: string) => {
        event.stopPropagation();
        await request.del(`/video_publish_history/${videoId}`);

        setVideos((prevVideos) => prevVideos.filter((video) => video.id !== videoId));
    };

    return (
        <div className={clsx(styles.dashboard)}>
            <FloatingParticles />
            <h2 className={clsx('text-light')}>Watch Videos</h2>
            <div className={clsx('row')}>
                {videos.map((video) => (
                    <div
                        key={video.videoId}
                        className={clsx(styles.videoItem, 'mb-4', 'me-4', 'col-12 col-md-6 col-lg-3')}
                        onClick={() => handleClickVideo(video.videoUrl)}
                    >
                        <FontAwesomeIcon
                            icon={faXmark}
                            className={clsx(styles.deleteVideoIcon)}
                            onClick={(event) => handleDeleteVideo(event, video.id)}
                        />
                        <img src={video.background} />
                        <div className={clsx('d-flex', 'justify-content-between', 'pt-2', 'bg-light')}>
                            <span>Tác phẩm</span>
                            <span>{video.title}</span>
                        </div>
                        <div className={clsx('d-flex', 'justify-content-between', 'pt-2', 'bg-light')}>
                            <span>Ngày tạo video</span>
                            <span>{video.publishDate}</span>
                        </div>
                    </div>
                ))}
            </div>
            {showModal && (
                <div className={styles.videoViewer}>
                    <FontAwesomeIcon
                        icon={faXmark}
                        className={clsx(styles.closeVideoIcon)}
                        onClick={handleCloseModal}
                    />
                    <video controls className={clsx(styles.videoShow)} src={videoUrl}>
                        <source src={videoUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                </div>
            )}
        </div>
    );
}

export default WatchVideos;
