import clsx from 'clsx';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilm } from '@fortawesome/free-solid-svg-icons';
import { faImage } from '@fortawesome/free-solid-svg-icons';
import styles from './DashBoard.module.css';
import LoadingComponent from '../../components/Loading';
import FloatingParticles from '../CreateVideo/CreateVideoComponents/FloatingParticles/FloatingParticles';

function DashBoard() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

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

    return (
        <div className={clsx(styles.dashboard)}>
            <FloatingParticles></FloatingParticles>
            {isLoading && (
                <LoadingComponent
                    customClassName={clsx('position-absolute', 'top-50', 'start-50')}
                    isOverlay={isLoading}
                />
            )}
            <div className={clsx(styles.dashboardContainer)}>
                <h2 className={clsx('text-light', 'mt-4', 'mb-4')}>Create your video in minutes</h2>
                <div className={clsx('d-flex')} style={{margin: '50px 0 0 0'}}>
                    <div
                        className={clsx(styles.videoContainer, 'd-flex', 'flex-column', 'justify-content-center')}
                        onClick={handleCreateVideo}
                    >
                        <FontAwesomeIcon icon={faFilm} className={clsx(styles.icon, 'mb-3')} />
                        <h5>Create new video</h5>
                    </div>
                </div>
            </div>
            <div className={clsx(styles.dashboardContainer)}>
                <div className={clsx('d-flex')}>
                    <div
                        className={clsx(styles.imageGenerateContainer, 'd-flex', 'flex-column', 'justify-content-center')}>
                        <FontAwesomeIcon icon={faImage} className={clsx(styles.icon, 'mb-3')} />
                        <h5>Create new image</h5>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DashBoard;
