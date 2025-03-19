import clsx from 'clsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilm, faImage } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import styles from './DashBoard.module.css';
import { publicRoutes } from '../../routes';

function DashBoard() {
    return (
        <div className={clsx(styles.dashboard)}>
            <div className={clsx('container', styles.dashboardContainer)}>
                <h2 className={clsx('text-light', 'mt-4', 'mb-4')}>Create your video in minutes</h2>
                <div className={clsx('d-flex')}>
                    <div className={clsx(styles.videoContainer, 'd-flex', 'flex-column', 'justify-content-center')}>
                        <FontAwesomeIcon icon={faFilm} className={clsx(styles.icon, 'mb-3')} />
                        <h5>Create new video</h5>
                    </div>
                </div>
                <div className={clsx('d-flex', 'mt-4')}>
                    <Link
                        to={publicRoutes[publicRoutes.length - 1].path}
                        className={clsx(styles.imageContainer, 'd-flex', 'flex-column', 'justify-content-center')}
                    >
                        <FontAwesomeIcon icon={faImage} className={clsx(styles.icon, 'mb-3')} />
                        <h5>Create new image</h5>
                    </Link>
                </div>
                <h2 className={clsx('text-light', 'mt-4', 'mb-4')}>Create your video in minutes</h2>
            </div>
        </div>
    );
}

export default DashBoard;
