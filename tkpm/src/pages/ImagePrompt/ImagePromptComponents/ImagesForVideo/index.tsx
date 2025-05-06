import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import * as request from '../../../../utils/request';
import { ImageConfig } from '../ImagesConfiguration';

import { Card, Button } from 'antd';
import styles from '../../ImagePrompt.module.css';
import ownStyles from './ImagesForVideo.module.css';
import LoadingComponent from '../../../../components/Loading';
import CustomizedCheckbox from '../../../../components/CustomizedCheckbox';
import SweetAlert from '../../../../components/SweetAlert';

interface ImagesSegment {
    text: string;
    images: string[];
    status: string;
}

interface ImagesForVideoProps {
    imageDes?: string[];
    promptId?: string;
    handleCheckedImagesListComplete?: (images: string[]) => void;
    imageConfig: ImageConfig;
    generationType: 'static' | 'motion';
    modelAIType: 'gemini' | 'stable_diffusion';
    checkedImagesList?: string[];
}

const ImagesForVideo: React.FC<ImagesForVideoProps> = ({
    imageDes,
    promptId,
    handleCheckedImagesListComplete,
    imageConfig,
    generationType,
    modelAIType,
    checkedImagesList,
}) => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isDownloading, setIsDownloading] = useState<boolean>(false);

    const [isShowingDownload, setIsShowingDownload] = useState<boolean>(false);
    const [isShowingCustomPrompt, setIsShowingCustomPrompt] = useState<boolean>(false);
    const [isShowingFinishCustomPrompt, setIsShowingFinishCustomPrompt] = useState<boolean>(false);

    const [promptInfo, setPromptInfo] = useState<string>('');
    const [imageData, setImageData] = useState<ImagesSegment[]>([]);
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
    const [localPath, setLocalPath] = useState<string[]>([]);

    useEffect(() => {
        console.log("ImageDes trong useEffect: ", imageDes);
        if (imageDes && imageDes.length > 0) {
            setImageData(
                imageDes.map((segment, index) => ({
                    text: segment,
                    images: checkedImagesList && index < checkedImagesList.length ? [checkedImagesList[index]] : [],
                    status: checkedImagesList && index < checkedImagesList.length ? 'success' : 'idle',
                })),
            );
        }

        if (checkedImagesList && checkedImagesList.length > 0) {
            setLocalPath(checkedImagesList);
        }
    }, [imageDes, checkedImagesList]);

    const handleGenerateImagesForSegments = async () => {
        try {
            setIsLoading(true);
            setBatchProcessing(true);
            setImageData((prev) => prev.map((item) => ({ ...item, status: 'loading' })));

            let endpoint = '';
            if (generationType === 'static') {
                endpoint =
                    modelAIType === 'gemini'
                        ? '/image/text-to-multiple-images-gemini'
                        : '/image/text-to-multiple-images';
            } else if (generationType === 'motion') {
                endpoint = '/image/text-to-animation';
            }
            if(imageDes)
            for (const segment of imageDes) {
                const response = await request.post(endpoint, {
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
        } catch {
            setImageData((prev) => prev.map((item) => ({ ...item, status: 'error' })));
        } finally {
            setBatchProcessing(false);
            setIsLoading(false);
        }
    };

    const handleCustomizedGeneration = (dataItem: ImagesSegment) => {
        setCustomizedGenerationClick(true);
        setCurrentSegment(dataItem);
        setPromptInfo('');
        setIsShowingCustomPrompt(true);
        setIsShowingFinishCustomPrompt(true);
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

            let endpoint = '';
            if (generationType === 'static') {
                endpoint =
                    modelAIType === 'gemini'
                        ? '/image/text-to-multiple-images-gemini'
                        : '/image/text-to-multiple-images';
            } else if (generationType === 'motion') {
                endpoint = '/image/text-to-animation';
            }

            const response = await request.post(endpoint, {
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
        } catch {
            setImageData((prevImageData) =>
                prevImageData.map((item) => (item.text === segment ? { ...item, status: 'error' } : item)),
            );
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
            const selectedForSegment = selectedImages.filter((img) => img.segmentId === imageSegmentIndex).length;
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
        setIsShowingCustomPrompt(false);
        setIsShowingFinishCustomPrompt(false);
    };

    const handleFinishImagesGeneration = async () => {
        try {
            setIsDownloading(true);

            const base64Paths = selectedImages.map((item) => item.path);
            let localImagePaths: string[] = [];
            const uploadSessionId = Date.now().toString();
            const batchSize = 5;
            const totalBatches = Math.ceil(base64Paths.length / batchSize);
            for (let i = 0; i < totalBatches; i++) {
                const startIdx = i * batchSize;
                const endIdx = Math.min(startIdx + batchSize, base64Paths.length);
                const batchImages = base64Paths.slice(startIdx, endIdx);
                const batchResponse = await request.post('/image/image-storage-batch', {
                    generationType: generationType,
                    images: batchImages,
                    promptId: promptId,
                    batchIndex: i,
                    totalBatches: totalBatches,
                    uploadSessionId: uploadSessionId,
                });
                if (batchResponse && batchResponse.paths) {
                    localImagePaths.push(...batchResponse.paths);
                }
            }
            // Pass the result to parent component
            if (handleCheckedImagesListComplete) {
                if (localImagePaths.length === 0) {
                    localImagePaths = localPath;
                }
                handleCheckedImagesListComplete(localImagePaths);
            }
        } catch {
            // handle error
        } finally {
            setIsDownloading(false);
        }
    };

    useEffect(() => {
        setIsShowingDownload(selectedImages.length > 0);
    }, [selectedImages]);

    return (
        <div className="p-4">
            <div className={clsx('container', 'd-flex', 'flex-column', 'h-100', 'w-100', 'position-relative')}>
                {isDownloading && (
                    <LoadingComponent
                        customClassName={clsx('position-absolute', 'top-50', 'start-50')}
                        description="Downloading images..."
                        isOverlay={isDownloading}
                    />
                )}
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
                            className={clsx(ownStyles.customButton, ownStyles.btnPrimary)}
                            onClick={handleGenerateImagesForSegments}
                            disabled={batchProcessing}
                        >
                            Full-script Generation
                        </button>
                        <div className={clsx('d-flex', 'flex-row-reverse', 'align-items-center')}>
                            <button
                                className={clsx('float-right', 'me-2', ownStyles.customButton, ownStyles.btnWarning, {
                                    [ownStyles.btnDisabled]: !isShowingFinishCustomPrompt,
                                    disabled: !isShowingFinishCustomPrompt,
                                })}
                                onClick={handleFinishCustomizedGeneration}
                            >
                                Xong
                            </button>
                            <button
                                className={clsx('float-right', 'me-2', ownStyles.customButton, ownStyles.btnDanger, {
                                    [ownStyles.btnDisabled]: !isShowingCustomPrompt,
                                    disabled: !isShowingCustomPrompt,
                                })}
                                disabled={isLoading || !customizedGenerationClick}
                                onClick={handleGenerateWithCustomPrompt}
                            >
                                Tạo ảnh sau khi tùy chỉnh
                            </button>
                            <button
                                className={clsx('float-right', 'me-2', ownStyles.customButton, ownStyles.btnSucess, {
                                    [ownStyles.btnDisabled]: !isShowingDownload,
                                    disabled: !isShowingDownload,
                                })}
                                disabled={isLoading || selectedImages.length === 0}
                                onClick={handleFinishImagesGeneration}
                            >
                                Save Images
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
                                            Tùy chỉnh phân đoạn
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
                                            {dataItem.status === 'success' ? 'Tạo lại hình ảnh' : 'Tạo ảnh'}
                                        </Button>
                                    </div>
                                }
                            >
                                <p className={styles.segmentCardBody}>{dataItem.text}</p>
                                {dataItem.status === 'loading' && (
                                    <div className="text-center py-3">
                                        <LoadingComponent />
                                        <p className={styles.segmentCardLoading}>Đang tạo ảnh...</p>
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
            </div>
            {isDownloading && (
                <SweetAlert
                    title="Tải tất cả ảnh thành công!"
                    text="Bây giờ bạn có thể sang bước tiếp theo."
                    icon="success"
                    confirmButtonText="OK"
                />
            )}
        </div>
    );
};

export default ImagesForVideo;
