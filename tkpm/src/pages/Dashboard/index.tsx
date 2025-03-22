import clsx from 'clsx';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilm, faImage } from '@fortawesome/free-solid-svg-icons';
import styles from './DashBoard.module.css';
import * as request from '../../utils/request';
import LoadingComponent from '../../components/Loading';

function DashBoard() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    const handleImagePrompt = async () => {
        try {
            setIsLoading(true);

            const promptId = await request.post('/information/create');
            navigate('/image-prompt', {
                state: {
                    promptId,
                },
            });
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

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
                    <div className={clsx(styles.videoContainer, 'd-flex', 'flex-column', 'justify-content-center')}>
                        <FontAwesomeIcon icon={faFilm} className={clsx(styles.icon, 'mb-3')} />
                        <h5>Create new video</h5>
                    </div>
                </div>
                <div className={clsx('d-flex', 'mt-4')}>
                    <div
                        className={clsx(styles.imageContainer, 'd-flex', 'flex-column', 'justify-content-center')}
                        onClick={handleImagePrompt}
                    >
                        <FontAwesomeIcon icon={faImage} className={clsx(styles.icon, 'mb-3')} />
                        <h5>Create new image</h5>
                    </div>
                </div>
                <h2 className={clsx('text-light', 'mt-4', 'mb-4')}>Create your video in minutes</h2>
            </div>
        </div>
    );
}

export default DashBoard;
