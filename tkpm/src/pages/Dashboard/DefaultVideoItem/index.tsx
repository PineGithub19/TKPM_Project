import clsx from 'clsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilm } from '@fortawesome/free-solid-svg-icons';

interface DefaultVideoItemProps {
    background?: string;
    videoId?: string;
}

function DefaultVideoItem({ background = '', videoId }: DefaultVideoItemProps) {
    return background ? (
        <div>
            <img src={background} alt="Video Thumbnail" className={clsx('img-fluid')} />
        </div>
    ) : (
        <div>
            <div
                className={clsx(
                    'd-flex',
                    'flex-column',
                    'justify-content-center',
                    'align-items-center',
                    'bg-primary',
                    'p-4',
                    'rounded-4',
                    'ms-4',
                )}
            >
                <FontAwesomeIcon icon={faFilm} className={clsx('mb-3', 'text-light', 'fs-2')} />
                <h5 className={clsx('text-light')}>Video in Progress</h5>
            </div>
        </div>
    );
}

export default DefaultVideoItem;
