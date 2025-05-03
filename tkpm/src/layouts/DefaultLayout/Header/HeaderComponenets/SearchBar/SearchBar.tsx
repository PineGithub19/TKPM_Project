import { useState, useEffect } from 'react';
import clsx from 'clsx';
import styles from './SearchBar.module.css';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useDebounce from '../../../../../hooks/useDebounce';

import LoadingComponent from '../../../../../components/Loading';
import * as request from '../../../../../utils/request';
import { useNavigate } from 'react-router-dom';

interface VideoInformation {
    videoId: string;
    scriptId: string;
    voiceId: string;
    imageId: string;
    title: string;
    author: string;
    background: string;
    createdAt: string;
    isFinished: boolean;
}

function SeearchBar() {
    const navigate = useNavigate();

    const [searchValue, setSearchValue] = useState('');
    const [loading, setLoading] = useState(false);
    const debouncedSearchValue = useDebounce(searchValue, 800);
    const [videos, setVideos] = useState<VideoInformation[]>([]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchValue(e.target.value);
        setLoading(true);
    };

    const handleInputSelection = async (videoData: VideoInformation) => {
        try {
            Promise.all([
                request.get(`/script_generate/get-script?promptId=${videoData.scriptId}`),
                request.get(`/voice/get-voices?promptId=${videoData.voiceId}`),
                request.get(`/image/get-images?promptId=${videoData.imageId}`),
            ]).then((response) => {
                const scriptList = response[0].scriptList || [];
                const selectedLiterature = response[0].selectedLiterature || null;
                const voiceList = response[1].voiceList || [];
                const checkedImages = response[2].imageList || [];

                navigate('/edit-video', {
                    state: {
                        scriptSegments: scriptList,
                        voicesList: voiceList,
                        checkedImagesList: checkedImages,
                        selectedLiterature: selectedLiterature,

                        promptId: videoData.videoId,
                        scriptPromptId: videoData.scriptId,
                        voicePromptId: videoData.voiceId,
                        imagePromptId: videoData.imageId,
                    },
                });
            });
        } catch (error) {
            console.error('Error fetching video data:', error);
        } finally {
            setSearchValue('');
        }
    };

    useEffect(() => {
        const fetchVideos = async () => {
            try {
                const response = await request.get('/video/search', {
                    searchValue: debouncedSearchValue,
                });
                setVideos(response.videos);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching videos:', error);
                setLoading(false);
            }
        };

        const executeFetch = async () => {
            if (debouncedSearchValue.length === 0) {
                setVideos([]);
                setLoading(false);
                return;
            }

            if (searchValue === debouncedSearchValue) {
                setLoading(false);
                await fetchVideos();
            }
        };

        executeFetch();
    }, [debouncedSearchValue, searchValue]);

    return (
        <div className={clsx('d-flex', 'align-items-center', 'position-relative', styles.searchContainer)}>
            <input
                type="text"
                placeholder="Search..."
                className={clsx(styles.searchInput, 'form-control')}
                value={searchValue}
                onChange={handleInputChange}
            />
            <FontAwesomeIcon
                icon={faMagnifyingGlass}
                className={clsx('position-absolute', 'top-50', 'end-0', 'translate-middle-y', 'text-black-50', 'me-3')}
            />
            <div className={clsx(styles.searchResult)}>
                {loading && (
                    <LoadingComponent
                        customClassName={clsx('position-absolute', 'top-50', 'start-50', 'translate-middle', 'mt-2')}
                    />
                )}
                {videos.map((video, index) => (
                    <div
                        key={index}
                        className={clsx(
                            'd-flex',
                            'align-items-start',
                            'ps-4',
                            'pe-4',
                            'pt-3',
                            'pb-3',
                            'w-100',
                            styles.searchResultItem,
                        )}
                        onClick={() => handleInputSelection(video)}
                    >
                        <img src={video.background} className={clsx(styles.searchResultImage)} />
                        <div
                            className={clsx(
                                'd-flex',
                                'flex-column',
                                'justify-content-between',
                                'ms-2',
                                'w-100',
                                'h-100',
                            )}
                        >
                            <div className={clsx('d-flex', 'justify-content-between', 'w-100')}>
                                <h5 className={clsx('text-black')}>{video.title}</h5>
                                <span className={clsx('text-black', 'text-black-50')}>
                                    {video.isFinished ? 'Finished' : 'Unfinished'}
                                </span>
                            </div>
                            <div className={clsx('d-flex', 'justify-content-between', 'w-100')}>
                                <span className={clsx('text-black')}>{video.author}</span>
                                <span className={clsx('text-black', 'text-black-50')}>{video.createdAt}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default SeearchBar;
