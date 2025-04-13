import clsx from 'clsx';
import { useCallback, useEffect, useState } from 'react';
import { BlockerFunction, useBlocker, Blocker } from 'react-router-dom';
import styles from './ImagePrompt.module.css';
import * as request from '../../utils/request';
import LoadingComponent from '../../components/Loading';
import CustomizedCheckbox from '../../components/CustomizedCheckbox';
import SweetAlert from '../../components/SweetAlert';
import { Button, Card, Tabs } from 'antd';

interface ImagesSegment {
    text: string;
    images: string[];
    status: string;
}

interface ImagesListComplete {
    images: string[];
    segment: string;
}

const { TabPane } = Tabs;

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

function ImagePrompt({
    promptId,
    scriptSegments = [],
    handleCheckedImagesListComplete,
}: {
    promptId?: string;
    scriptSegments?: string[];
    handleCheckedImagesListComplete?: (images: ImagesListComplete[]) => void;
}) {
    const [promptInfo, setPromptInfo] = useState<string>();
    const [imageData, setImageData] = useState<ImagesSegment[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [selectedImages, setSelectedImages] = useState<
        {
            segmentId: number;
            id: number;
            path: string;
        }[]
    >([]);
    const [batchProcessing, setBatchProcessing] = useState<boolean>(false);
    const [customizedGenerationClick, setCustomizedGenerationClick] = useState<boolean>(false);
    const [currentSegment, setCurrentSegment] = useState<ImagesSegment | null>(null);
    const [isFinishedVideo, setIsFinishedVideo] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<string>('1');
    const [imageConfig, setImageConfig] = useState({
        steps: 10,
        width: 256,
        height: 256,
        cfg_scale: 7,
        seed: -1,
        sampler_name: 'Euler a',
        batch_size: 2,
        model: 'dreamshaper_8.safetensors',
    });

    useEffect(() => {
        console.log(scriptSegments.length);
        if (scriptSegments && scriptSegments.length > 0) {
            setImageData(
                scriptSegments.map((segment) => ({
                    text: segment,
                    images: [],
                    status: 'idle',
                })),
            );
        }
    }, [scriptSegments]);

    const handleTabChange = (key: string) => {
        setActiveTab(key);
    };

    const handleGenerateImagesForSegments = async () => {
        try {
            setIsLoading(true);
            setBatchProcessing(true);

            // Set all segments to loading state
            setImageData((prev) => prev.map((item) => ({ ...item, status: 'loading' })));

            // Generate images for all segments
            for (const segment of scriptSegments) {
                const response = await request.post('/image/text-to-multiple-images', {
                    prompt: segment,
                    configuration: imageConfig,
                });

                const base64Images = response.imageList;
                const imageSources = base64Images.map((base64Image: string) => `data:image/png;base64,${base64Image}`);

                setImageData((prevData) =>
                    prevData.map((item) =>
                        item.text === segment
                            ? {
                                  ...item,
                                  images: imageSources,
                                  status: 'success',
                              }
                            : item,
                    ),
                );
            }
        } catch (error) {
            console.error('Error:', error);
            // Set all segments to error state
            setImageData((prev) => prev.map((item) => ({ ...item, status: 'error' })));
        } finally {
            setBatchProcessing(false);
            setIsLoading(false);
        }
    };

    const handleCustomizedGeneration = (dataItem: ImagesSegment) => {
        setCustomizedGenerationClick(true);
        setCurrentSegment(dataItem);
        setPromptInfo(''); // Reset prompt info when starting new customization
    };

    const handleGenerateWithCustomPrompt = async () => {
        if (currentSegment) {
            await generateImagesForSegment(currentSegment, promptInfo);
        }
    };

    const generateImagesForSegment = async (dataItem: ImagesSegment, additionalPrompt?: string): Promise<void> => {
        const segment = dataItem.text;

        try {
            setIsLoading(true);

            setImageData((prevImageData) =>
                prevImageData.map((item) => (item.text === segment ? { ...item, status: 'loading' } : item)),
            );

            const enhancedPrompt = additionalPrompt
                ? `${segment}, ${additionalPrompt}, (high quality:1.4), (detailed:1.2), (sharp focus:1.1), 4k, masterpiece`
                : `${segment}, (high quality:1.4), (detailed:1.2), (sharp focus:1.1), 4k, masterpiece`;

            const response = await request.post('/image/text-to-multiple-images', {
                prompt: enhancedPrompt,
                configuration: imageConfig,
            });

            const base64Images = response.imageList;
            const imageSources = base64Images.map((base64Image: string) => `data:image/png;base64,${base64Image}`);

            setImageData((prevImageData) =>
                prevImageData.map((item) =>
                    item.text === segment
                        ? {
                              ...item,
                              images: [...item.images, ...imageSources],
                              status: 'success',
                          }
                        : item,
                ),
            );
        } catch (error) {
            setImageData((prevImageData) =>
                prevImageData.map((item) => (item.text === segment ? { ...item, status: 'error' } : item)),
            );
            console.error('Error generating images for segment:', error);
        } finally {
            setIsLoading(false);
            setCustomizedGenerationClick(false);
        }
    };

    const handleSelectImage = (imageSegmentIndex: number, imageId: number, limit: number = 1) => {
        const index = selectedImages.findIndex(
            (image) => image.segmentId === imageSegmentIndex && image.id === imageId,
        );

        if (index === -1) {
            // Count how many images are already selected for this segment
            const selectedForSegment = selectedImages.filter((img) => img.segmentId === imageSegmentIndex).length;

            // If limit is -1, allow unlimited selections
            // Otherwise, check if we've reached the limit for this segment
            if (limit === -1 || selectedForSegment < limit) {
                setSelectedImages([
                    ...selectedImages,
                    { segmentId: imageSegmentIndex, id: imageId, path: imageData[imageSegmentIndex].images[imageId] },
                ]);
            }
        } else {
            const newSelectedImages = selectedImages.filter(
                (image) => !(image.segmentId === imageSegmentIndex && image.id === imageId),
            );
            setSelectedImages(newSelectedImages);
        }
    };

    const handleFinishCustomizedGeneration = () => {
        setCustomizedGenerationClick(false);
        setCurrentSegment(null);
        setPromptInfo('');
    };

    const handleCreateVideo = async () => {
        setIsFinishedVideo(true);

        // Group selected images by segment
        const selectedImagesBySegment = selectedImages.reduce((acc, image) => {
            const segment = imageData[image.segmentId].text;
            if (!acc[segment]) {
                acc[segment] = [];
            }
            acc[segment].push(image.path);
            return acc;
        }, {} as Record<string, string[]>);

        await request.post('/image/image-storage', {
            images: selectedImages.map((item) => item.path),
            promptId: promptId,
        });

        // Convert to ImagesListComplete format
        const result: ImagesListComplete[] = Object.entries(selectedImagesBySegment).map(([segment, images]) => ({
            segment,
            images,
        }));

        // Pass the result to parent component
        if (handleCheckedImagesListComplete) {
            handleCheckedImagesListComplete(result);
        }

        // Switch to the configuration tab after saving
        setActiveTab('1');
    };

    const handleConfigChange = (key: string, value: number | string) => {
        setImageConfig((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const renderImagesConfiguration = () => (
        <div className="p-4">
            <div className="container">
                <h4 className="mb-4">Image Generation Settings</h4>
                <div className="row g-3">
                    <div className="col-md-6">
                        <label className="form-label">Steps (1-150)</label>
                        <input
                            type="number"
                            className="form-control"
                            value={imageConfig.steps}
                            min={1}
                            max={150}
                            onChange={(e) => handleConfigChange('steps', parseInt(e.target.value))}
                        />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label">CFG Scale (1-30)</label>
                        <input
                            type="number"
                            className="form-control"
                            value={imageConfig.cfg_scale}
                            min={1}
                            max={30}
                            onChange={(e) => handleConfigChange('cfg_scale', parseInt(e.target.value))}
                        />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label">Batch Size (1-10)</label>
                        <input
                            type="number"
                            className="form-control"
                            value={imageConfig.batch_size}
                            min={1}
                            max={10}
                            onChange={(e) => handleConfigChange('batch_size', parseInt(e.target.value))}
                        />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label">Style</label>
                        <select
                            className="form-select"
                            value={imageConfig.model}
                            onChange={(e) => handleConfigChange('model', e.target.value)}
                        >
                            <option value="dreamshaper_8.safetensors">Reality</option>
                            <option value="toonyou_beta6.safetensors">Cartoon (Anime)</option>
                        </select>
                    </div>
                    <div className="col-md-6">
                        <label className="form-label">Sampler</label>
                        <select
                            className="form-select"
                            value={imageConfig.sampler_name}
                            onChange={(e) => handleConfigChange('sampler_name', e.target.value)}
                        >
                            <option value="Euler a">Euler a (Recommended)</option>
                            <option value="Euler">Euler</option>
                            <option value="DPM++ 2M">DPM++ 2M</option>
                            <option value="DPM++ SDE">DPM++ SDE</option>
                            <option value="UniPC">UniPC</option>
                            <option value="DDIM">DDIM</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderImagesForVideo = () => (
        <div className="p-4">
            <div className={clsx('container', 'd-flex', 'flex-column', 'h-100', 'w-100')}>
                <div className={clsx('d-flex', 'flex-column', 'align-items-start')}>
                    <p className="mb-4">
                        <strong>{currentSegment?.text}</strong>
                    </p>
                    <div className={clsx('form-floating', 'w-100')}>
                        <textarea
                            className={clsx('form-control')}
                            placeholder="Leave a comment here"
                            id="floatingTextarea2"
                            style={{ height: '100px' }}
                            value={promptInfo}
                            disabled={!customizedGenerationClick}
                            onChange={(e) => setPromptInfo(e.target.value)}
                        ></textarea>
                        <label htmlFor="floatingTextarea2">Prompt Here</label>
                    </div>
                    <div
                        className={clsx(
                            'd-flex',
                            'align-items-center',
                            'justify-content-between',
                            'w-100',
                            'mt-2',
                            'mb-4',
                        )}
                    >
                        <button
                            className={clsx('btn', 'btn-info')}
                            onClick={handleGenerateImagesForSegments}
                            disabled={batchProcessing}
                        >
                            Full-script Generation
                        </button>
                        <div className={clsx('d-flex', 'flex-row-reverse', 'align-items-center')}>
                            <button
                                className={clsx('btn', 'btn-warning', 'float-right', 'me-2')}
                                onClick={handleFinishCustomizedGeneration}
                            >
                                Finish
                            </button>
                            <button
                                className={clsx('btn', 'btn-primary', 'float-right', 'me-2')}
                                disabled={isLoading || !customizedGenerationClick}
                                onClick={handleGenerateWithCustomPrompt}
                            >
                                Generate Images
                            </button>
                            <button
                                className={clsx('btn', 'btn-success', 'float-right', 'me-2')}
                                disabled={isLoading || selectedImages.length === 0}
                                onClick={handleCreateVideo}
                            >
                                Next Step
                            </button>
                        </div>
                    </div>
                    <div className={styles.segmentsList}>
                        {imageData.map((dataItem, imageSegmentIndex) => (
                            <Card
                                key={imageSegmentIndex}
                                className={styles.segmentCard}
                                title={`Phân đoạn #${imageSegmentIndex + 1}`}
                                extra={
                                    <div className={styles.segmentCardActions}>
                                        <Button
                                            type="link"
                                            onClick={() => handleCustomizedGeneration(dataItem)}
                                            disabled={
                                                dataItem.status === 'loading' ||
                                                batchProcessing ||
                                                customizedGenerationClick
                                            }
                                            className={styles.segmentCardButton}
                                        >
                                            Customized Generation
                                        </Button>
                                        <Button
                                            type="link"
                                            onClick={() => generateImagesForSegment(dataItem)}
                                            disabled={
                                                dataItem.status === 'loading' ||
                                                batchProcessing ||
                                                customizedGenerationClick
                                            }
                                            className={styles.segmentCardButton}
                                        >
                                            {dataItem.status === 'success' ? 'Re-generate' : 'Generate Images'}
                                        </Button>
                                    </div>
                                }
                            >
                                <p className={styles.segmentCardBody}>{dataItem.text}</p>

                                {dataItem.status === 'loading' && (
                                    <div className="text-center py-3">
                                        <LoadingComponent />
                                        <p className={styles.segmentCardLoading}>Images are being generated...</p>
                                    </div>
                                )}

                                {dataItem.status === 'error' && (
                                    <div className={styles.segmentCardError}>
                                        Errors occurred while generating images. Please try again.
                                    </div>
                                )}

                                {dataItem.status === 'success' && (
                                    <div className={styles.segmentCardImageGrid}>
                                        {dataItem.images.length > 0 &&
                                            dataItem.images.map((imageItem, imageItemIndex) => (
                                                <div key={imageItemIndex} className={styles.segmentCardImageItem}>
                                                    <img
                                                        src={imageItem}
                                                        alt={`image-${imageItemIndex}`}
                                                        className={styles.segmentCardImage}
                                                    />
                                                    <CustomizedCheckbox
                                                        isChecked={selectedImages.some(
                                                            (item) =>
                                                                item.segmentId === imageSegmentIndex &&
                                                                item.id === imageItemIndex,
                                                        )}
                                                        onClick={() =>
                                                            handleSelectImage(imageSegmentIndex, imageItemIndex, 1)
                                                        }
                                                    />
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </Card>
                        ))}
                    </div>
                </div>
                <ImportantAlert isFinishedVideo={isFinishedVideo} promptId={promptId} />
            </div>
        </div>
    );

    return (
        <Tabs activeKey={activeTab} onChange={handleTabChange}>
            <TabPane tab="Images Configuration" key="1">
                {renderImagesConfiguration()}
            </TabPane>
            <TabPane tab="Images Generation" key="2">
                {renderImagesForVideo()}
            </TabPane>
        </Tabs>
    );
}

export default ImagePrompt;
