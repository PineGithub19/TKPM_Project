import clsx from 'clsx';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilm, faXmark, faClockRotateLeft, faCheck } from '@fortawesome/free-solid-svg-icons';
import styles from './DefaultVideoItem.module.css';
import * as request from '../../../utils/request';

interface VideoInformation {
    videoId: string;
    scriptId: string;
    voiceId: string;
    imageId: string;
    is_finished: boolean;
    background?: string;
}

function DefaultVideoItem({
    videoData,
    onDelete,
}: {
    videoData: VideoInformation;
    onDelete: (videoId: string) => void;
}) {
    const navigate = useNavigate();

    const [scriptSegments, setScriptSegments] = useState<string[]>([]);
    const [voicesList, setVoicesList] = useState<string[]>([]);
    const [checkedImagesList, setCheckedImagesList] = useState<string[]>([]);
    const [selectedLiterature, setSelectedLiterature] = useState<{ content: string; title: string } | null>(null);
    const [background, setBackground] = useState<string | undefined>(videoData.background);

    useEffect(() => {
        let isMounted = true;
        Promise.all([
            request.get(`/script_generate/get-script?promptId=${videoData.scriptId}`),
            request.get(`/voice/get-voices?promptId=${videoData.voiceId}`),
            request.get(`/image/get-images?promptId=${videoData.imageId}`),
        ]).then((response) => {
            if (!isMounted) return;
            setScriptSegments(response[0].scriptList || []);
            setSelectedLiterature(response[0].selectedLiterature || null);
            setVoicesList(response[1].voiceList || []);
            setCheckedImagesList(response[2].imageList || []);
            if (!videoData.background && response[2].imageList && response[2].imageList.length > 0) {
                setBackground(response[2].imageList[0]);
            }
        });
        return () => {
            isMounted = false;
        };
    }, [videoData.scriptId, videoData.voiceId, videoData.imageId, videoData.background]);

    const handleClick = async () => {
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
            <div className={clsx('position-relative')}>
                {background ? (
                    <div className={clsx(styles.backgroundContainer, 'position-relative')}>
                        <img src={background} alt="Video Thumbnail" className={clsx(styles.imageConfig)} />
                        <FontAwesomeIcon
                            icon={videoData.is_finished ? faCheck : faClockRotateLeft}
                            className={clsx('fs-5', 'position-absolute', 'end-0', 'bottom-0', 'me-2', 'mb-2', {
                                [styles.pendingICon]: !videoData.is_finished,
                                [styles.completedIcon]: videoData.is_finished,
                            })}
                        />
                    </div>
                ) : (
                    <div
                        className={clsx(
                            'd-flex',
                            'flex-column',
                            'justify-content-center',
                            'align-items-center',
                            'ms-4',
                            styles.noBackgroundContainer,
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
                )}
                <div
                    onClick={(e) => handleDeleteVideo(e)}
                    className={clsx(
                        'position-absolute',
                        'top-0',
                        'end-0',
                        'p-1',
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
        </div>
    );
}

export default DefaultVideoItem;
