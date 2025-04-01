import clsx from 'clsx';
import { useCallback, useEffect, useState } from 'react';
import { BlockerFunction, useBlocker, Blocker } from 'react-router-dom';
import * as request from '../../utils/request';
import LoadingComponent from '../../components/Loading';
import CustomizedCheckbox from '../../components/CustomizedCheckbox';
import SweetAlert from '../../components/SweetAlert';

function ImportantAlert({ isFinishedVideo, promptId }: { isFinishedVideo: boolean; promptId?: string }) {
    const [isAlerted, setIsAlerted] = useState<boolean>(false);
    const handleConfirmAlert = async (blocker: Blocker) => {
        if (blocker.state === 'blocked') {
            try {
                await request.del('/information/delete', { promptId: promptId });
            } catch (error) {
                console.log(error);
            } finally {
                blocker.proceed?.();
                setIsAlerted(false);
            }
        }
    };

    const shouldBlock = useCallback<BlockerFunction>(
        ({ currentLocation, nextLocation }) => {
            return isFinishedVideo === false && currentLocation.pathname !== nextLocation.pathname;
        },
        [isFinishedVideo],
    );

    const blocker = useBlocker(shouldBlock);

    useEffect(() => {
        if (blocker.state === 'blocked' && isFinishedVideo === false) {
            // blocker.reset();
            setIsAlerted(blocker.state === 'blocked');
        }
    }, [blocker, isFinishedVideo]);

    return isAlerted ? (
        <SweetAlert
            title="Wanna leave this page?"
            text="Your video has not been created yet. Your changes won't be saved."
            icon="question"
            onConfirm={() => handleConfirmAlert(blocker)}
        />
    ) : null;
}

function ImagePrompt({ promptId }: { promptId?: string }) {
    // const location = useLocation();
    // const promptId = location.state.promptId;
    const [promptInfo, setPromptInfo] = useState<string>();
    const [imageData, setImageData] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [selectedImages, setSelectedImages] = useState<
        {
            id: string;
            path: string;
        }[]
    >([]);

    const handleSubmit = async () => {
        try {
            setIsLoading(true);
            const response = await request.post('/image/text-to-multiple-images', {
                prompt: promptInfo,
                promptId: promptId,
            });

            const base64Images = response.imageList;
            const imageSources = base64Images.map((base64Image: string) => `data:image/png;base64,${base64Image}`);

            setImageData(imageSources);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectImage = (imageId: string) => {
        const index = selectedImages.findIndex((image) => image.id === imageId);
        if (index === -1) {
            setSelectedImages([...selectedImages, { id: imageId, path: imageData[parseInt(imageId)] }]);
        } else {
            const newSelectedImages = selectedImages.filter((image) => image.id !== imageId);
            setSelectedImages(newSelectedImages);
        }
    };

    const [isFinishedVideo, setIsFinishedVideo] = useState<boolean>(false);

    const handleCreateVideo = async () => {
        setIsFinishedVideo(true);
    };

    useEffect(() => {
        const fetchImages = async () => {
            try {
                setIsLoading(true);
                const response = await request.get('/image/get-images', { promptId: promptId });
                const base64Images = response.imageList;
                const imageSources = base64Images.map((base64Image: string) => `data:image/png;base64,${base64Image}`);

                setImageData(imageSources);
            } catch (error) {
                console.error('Error:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchImages();
    }, []);

    return (
        <div className={clsx('container', 'd-flex', 'flex-column', 'h-100', 'w-100')}>
            <div>
                <div className={clsx('prompt-body')}>
                    <div className={clsx('d-flex', 'flex-wrap', 'justify-content-start', 'mb-4')}>
                        {imageData.length > 0 &&
                            imageData.map((image, index) => (
                                <div key={index} className={clsx('d-flex', 'flex-column', 'align-items-center')}>
                                    <img
                                        key={index}
                                        src={image}
                                        alt={`image-${index}`}
                                        className={clsx('rounded', 'm-2', 'img-thumbnail')}
                                    />
                                    <CustomizedCheckbox onClick={() => handleSelectImage(index.toString())} />
                                </div>
                            ))}
                    </div>
                </div>
                {isLoading && <LoadingComponent />}
            </div>
            <div className={clsx('d-flex', 'flex-column', 'align-items-end')}>
                <div className={clsx('form-floating', 'w-100')}>
                    <textarea
                        className={clsx('form-control')}
                        placeholder="Leave a comment here"
                        id="floatingTextarea2"
                        style={{ height: '100px' }}
                        value={promptInfo}
                        onChange={(e) => setPromptInfo(e.target.value)}
                    ></textarea>
                    <label htmlFor="floatingTextarea2">Prompt Here</label>
                </div>
                <div className={clsx('d-flex', 'flex-row-reverse', 'align-items-center', 'w-100')}>
                    <button
                        className={clsx('btn', 'btn-primary', 'float-right', 'mt-2')}
                        disabled={isLoading || !promptInfo}
                        onClick={handleSubmit}
                    >
                        Submit
                    </button>
                    <button
                        className={clsx('btn', 'btn-success', 'float-right', 'mt-2', 'me-2')}
                        disabled={isLoading || selectedImages.length === 0}
                        onClick={handleCreateVideo}
                    >
                        Create Video
                    </button>
                </div>
            </div>
            <ImportantAlert isFinishedVideo={isFinishedVideo} promptId={promptId} />
        </div>
    );
}

export default ImagePrompt;
