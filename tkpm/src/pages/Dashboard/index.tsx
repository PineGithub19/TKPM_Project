import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilm } from '@fortawesome/free-solid-svg-icons';
import styles from './DashBoard.module.css';
import LoadingComponent from '../../components/Loading';
import * as request from '../../utils/request';
import DefaultVideoItem from './DefaultVideoItem';
import DataChart from './DataChart';

interface VideoInformation {
    videoId: string;
    scriptId: string;
    voiceId: string;
    imageId: string;
    is_finished: boolean;
    background: string;
}

interface VideoConfigData {
    _id?: string;
    user_id?: string;
    literature_work_id: string;
    script: string;
    voice_config: string;
    image_config: string;
    is_finished: boolean;
    publish_date: Date;
}

function DashBoard() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [videoInformation, setVideoInformation] = useState<VideoInformation[]>([]);

    const handleCreateVideo = async () => {
        try {
            setIsLoading(true);
            navigate('/create-video');
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteVideo = (videoId: string) => {
        setVideoInformation((prevVideos) => prevVideos.filter((video) => video.videoId !== videoId));
    };

    useEffect(() => {
        const fetchVideoInformation = async () => {
            try {
                setIsLoading(true);
                const response = await request.get('/video/all');

                if (response) {
                    setVideoInformation(
                        response.videos.map((item: VideoConfigData) => ({
                            videoId: item._id,
                            scriptId: item.literature_work_id,
                            voiceId: item.voice_config,
                            imageId: item.image_config,
                            is_finished: item.is_finished,
                        })) || [],
                    );
                }
            } catch (error) {
                console.error('Error fetching video information:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchVideoInformation();

        return () => {
            setVideoInformation([]);
        };
    }, []);

    return (
        <div className={clsx(styles.dashboard, 'position-relative')}>
            {isLoading && (
                <LoadingComponent
                    customClassName={clsx('position-absolute', 'top-50', 'start-50')}
                    isOverlay={isLoading}
                />
            )}
            <div className={clsx('container', styles.dashboardContainer)}>
                <h2 className={clsx('text-light', 'mt-4', 'mb-4')}>Create your video in minutes</h2>
                <div className={clsx('d-flex')}>
                    <div
                        className={clsx(styles.videoContainer, 'd-flex', 'flex-column', 'justify-content-center')}
                        onClick={handleCreateVideo}
                    >
                        <FontAwesomeIcon icon={faFilm} className={clsx(styles.icon, 'mb-3')} />
                        <h5>Create new video</h5>
                    </div>
                    {videoInformation.length > 0 &&
                        videoInformation.map((video) => (
                            <DefaultVideoItem key={video.videoId} videoData={video} onDelete={handleDeleteVideo} />
                        ))}
                </div>
                <h2 className={clsx('text-light', 'mt-4', 'mb-4')}>Create your video in minutes</h2>
                <DataChart />
            </div>
        </div>
    );
}

export default DashBoard;
