import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilm } from '@fortawesome/free-solid-svg-icons';
import styles from './DashBoard.module.css';
import LoadingComponent from '../../components/Loading';
import * as request from '../../utils/request';
import DefaultVideoItem from './DefaultVideoItem';

interface VideoInformation {
    videoId: string;
    background: string;
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

    useEffect(() => {
        const fetchVideoInformation = async () => {
            try {
                setIsLoading(true);
                const response = await request.get('/video/all');

                if (response) {
                    setVideoInformation(response.videos || []);
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
                            <DefaultVideoItem
                                key={video.videoId}
                                background={video.background}
                                videoId={video.videoId}
                            />
                        ))}
                </div>
                <h2 className={clsx('text-light', 'mt-4', 'mb-4')}>Create your video in minutes</h2>
            </div>
        </div>
    );
}

export default DashBoard;
