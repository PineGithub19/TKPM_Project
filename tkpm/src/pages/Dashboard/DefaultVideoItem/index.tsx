import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilm, faXmark } from '@fortawesome/free-solid-svg-icons';
import styles from './DefaultVideoItem.module.css';
import * as request from '../../../utils/request';

interface VideoInformation {
    videoId: string;
    scriptId: string;
    voiceId: string;
    imageId: string;
    is_finished: boolean;
    background: string;
}

function DefaultVideoItem({
    videoData,
    onDelete,
}: {
    videoData: VideoInformation;
    onDelete: (videoId: string) => void;
}) {
    const navigate = useNavigate();

    const handleClick = async () => {
        const response = await Promise.all([
            request.get(`/script_generate/get-script?promptId=${videoData.scriptId}`),
            request.get(`/voice/get-voices?promptId=${videoData.voiceId}`),
            request.get(`/image/get-images?promptId=${videoData.imageId}`),
        ]);

        const scriptSegments = response[0].scriptList || [];
        const selectedLiterature = response[0].selectedLiterature || null;
        const voicesList = response[1].voiceList || [];
        const checkedImagesList = response[2].imageList || [];

        navigate('/edit-video', {
            state: {
                scriptSegments: scriptSegments,
                voicesList: voicesList,
                checkedImagesList: checkedImagesList,
                selectedLiterature: selectedLiterature,

                promptId: videoData.videoId,
                scriptPromptId: videoData.scriptId,
                voicePromptId: videoData.voiceId,
                imagePromptId: videoData.imageId,
            },
        });

        if (videoData.is_finished) {
            // Handle click for pending status
        }
        if (!videoData.is_finished) {
            // Handle click for finished status
        }
    };

    const handleDeleteVideo = async (e: React.MouseEvent) => {
        e.stopPropagation();

        try {
            await request.del('/information/delete', {
                promptId: videoData.videoId,
                scriptId: videoData.scriptId,
                voiceId: videoData.voiceId,
                imageId: videoData.imageId,
            });
            onDelete(videoData.videoId);
        } catch (error) {
            console.error('Error deleting video:', error);
        }
    };

    return (
        <div onClick={handleClick}>
            {videoData.background ? (
                <div>
                    <img src={videoData.background} alt="Video Thumbnail" className={clsx('img-fluid')} />
                </div>
            ) : (
                <div className={clsx('position-relative')}>
                    <div
                        className={clsx(
                            'd-flex',
                            'flex-column',
                            'justify-content-center',
                            'align-items-center',
                            'ms-4',
                            styles.imageContainer,
                            {
                                [styles.incompletedStatusBackground]: !videoData.is_finished,
                                [styles.completedStatusBackground]: videoData.is_finished,
                            },
                        )}
                    >
                        <FontAwesomeIcon icon={faFilm} className={clsx('mb-3', 'text-black', 'fs-2')} />
                        <h5 className={clsx('text-black')}>
                            {videoData.is_finished ? 'Completed Video' : 'Video in Progress'}
                        </h5>
                    </div>
                    <div
                        onClick={(e) => handleDeleteVideo(e)}
                        className={clsx(
                            'position-absolute',
                            'top-0',
                            'end-0',
                            'p-2',
                            'pe-3',
                            'ps-3',
                            'rounded-start',
                            'rounded-end',
                            'bg-white',
                            styles.iconContainer,
                        )}
                    >
                        <FontAwesomeIcon icon={faXmark} />
                    </div>
                </div>
            )}
        </div>
    );
}

export default DefaultVideoItem;
