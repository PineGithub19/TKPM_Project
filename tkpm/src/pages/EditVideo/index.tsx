import React, { useState, useRef, useEffect } from 'react';
import styles from './EditVideo.module.css';
import { useNavigate, useLocation } from 'react-router-dom';
import FloatingParticles from '../CreateVideo/CreateVideoComponents/FloatingParticles/FloatingParticles';
import clsx from 'clsx';
import { post } from '../../utils/request';
import HeaderCategory from './EditVideoComponents/HeaderCategory/HeaderCategory';
import CaptionEdit from './EditVideoComponents/CaptionEdit/CaptionEdit';
import PromptEdit from './EditVideoComponents/PromptEdit/PromptEdit';
import SoundAndSpeed from './EditVideoComponents/SoundAndSpeed/SoundAndSpeed';
import ImageEdit from './EditVideoComponents/ImageEdit/ImageEdit';
import ImageAdjustment from './EditVideoComponents/ImageAdjustment/ImageAdjustment';
import LoadingComponent from '../../components/Loading';

interface LocationState {
    scriptSegments?: string[];
    checkedImagesList?: string[];
    voicesList?: string[];
    selectedLiterature?: { content: string; title: string };

    promptId?: string;
    scriptPromptId?: string;
    voicePromptId?: string;
    imagePromptId?: string;
}

type IconKeys =
    | 'iconStyle'
    | 'iconRatio'
    | 'iconLayout'
    | 'iconDelete'
    | 'iconCutVideo'
    | 'iconCutImage'
    | 'iconAdjust'
    | 'iconSound'
    | 'iconCaption'
    | 'iconPrompt';

const EditVideo: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state as LocationState;

    // Access the passed data
    const [scriptSegments, setScriptSegments] = useState<string[]>(state?.scriptSegments || []);
    const [checkedImagesList, setCheckedImagesList] = useState<string[]>(state?.checkedImagesList || []);
    const [voicesList, setVoicesList] = useState<string[]>(state?.voicesList || []);
    const [selectedLiterature] = useState<{ content: string; title: string } | null>(state?.selectedLiterature || null);

    const [promptId, setPromptId] = useState<string>(state?.promptId || '');
    const [scriptPromptId, setScriptId] = useState<string>(state?.scriptPromptId || '');
    const [voicePromptId, setVoicePromptId] = useState<string>(state?.voicePromptId || '');
    const [imagePromptId, setImagePromptId] = useState<string>(state?.imagePromptId || '');

    const [selectedSegmentIndex, setSelectedSegmentIndex] = useState<number>(0);

    const [selectedIcon, setSelectedIcon] = useState<IconKeys>('iconStyle');
    const [selectedRatio, setSelectedRatio] = useState<string>('16:9');

    const introImageRef = useRef<HTMLDivElement | null>(null);

    const [height, setHeight] = useState<number>(0);
    const [width, setWidth] = useState<number>(0);

    const [volume, setVolume] = useState(30);
    const [speed, setSpeed] = useState(50);
    const [musicFile, setMusicFile] = useState<File | null>(null);
    const [musicFileName, setMusicFileName] = useState<string>('');

    const [brightness, setBrightness] = useState(50);
    const [contrast, setContrast] = useState(50);
    const [exposure, setExposure] = useState(50);
    const [temperature, setTemperature] = useState(50);
    const [saturation, setSaturation] = useState(50);
    const [blur, setBlur] = useState(0);
    const [vignette, setVignette] = useState(50);
    const [clarity, setClarity] = useState(50);

    const [flippedVertically, setFlippedVertically] = useState(false);
    const [rotated, setRotated] = useState(false);
    const [iconFlipColor, setIconFlipColor] = useState('/iconFlipVerticalWhite.png');
    const [iconRotateColor, setIconRotateColor] = useState('/iconRotateWhite.png');

    const [caption, setCaption] = useState<string>('');
    const [newPrompt, setnewPrompt] = useState<string>('');
    const [selectedContentStyles, setSelectedContentStyles] = useState<string[]>([]);

    // Use first image from checkedImagesList if available
    const [selectedImage, setSelectedImage] = useState<string | null>(
        checkedImagesList.length > 0 && checkedImagesList[0] ? checkedImagesList[0] : '/anime.png',
    );

    useEffect(() => {
        if (state) {
            setScriptSegments(state?.scriptSegments || []);
            setCheckedImagesList(state?.checkedImagesList || []);
            setVoicesList(state?.voicesList || []);

            setPromptId(state?.promptId || '');
            setScriptId(state?.scriptPromptId || '');
            setVoicePromptId(state?.voicePromptId || '');
            setImagePromptId(state?.imagePromptId || '');
        }
    }, [state]);

    useEffect(() => {
        if (checkedImagesList.length > 0) {
            setSelectedImage(checkedImagesList[0]);
        } else {
            setSelectedImage(null);
        }
    }, [checkedImagesList]);

    // Log data from CreateVideo if needed
    useEffect(() => {
        console.log('Received from CreateVideo:', {
            scriptSegments,
            checkedImagesList,
            voicesList,
            selectedLiterature,

            //các id của phiên làm việc:
            promptId,
            scriptPromptId,
            voicePromptId,
            imagePromptId,
        });
    }, [scriptSegments, checkedImagesList, voicesList]);

    const ratioMap: { [key: string]: number } = {
        '16:9': 16 / 9,
        '1:1': 1,
        '9:16': 9 / 16,
        '4:5': 4 / 5,
        '3:4': 3 / 4,
        '4:3': 4 / 3,
        '21:9': 21 / 9,
        '3:2': 3 / 2,
    };

    const videoDuration = 500;
    const timelineMarkers: string[] = [];
    timelineMarkers.push('1s');
    const numMarkers = 4;
    const interval = Math.floor(videoDuration / (numMarkers - 1));
    let currentTime = interval;
    for (let i = 1; i < numMarkers - 1; i++) {
        timelineMarkers.push(`${currentTime}s`);
        currentTime += interval;
    }
    timelineMarkers.push(`${videoDuration}s`);

    const convertToTimeFormat = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        const formattedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
        const formattedSeconds = remainingSeconds < 10 ? `0${remainingSeconds}` : `${remainingSeconds}`;
        return `${formattedMinutes}:${formattedSeconds}`;
    };

    const finalTimeline: string[] = [];
    for (let i = 0; i < timelineMarkers.length; i++) {
        finalTimeline.push(convertToTimeFormat(parseInt(timelineMarkers[i])));
        if (i < timelineMarkers.length - 1) {
            for (let j = 0; j < 3; j++) {
                finalTimeline.push('‧');
            }
        }
    }

    // Generate image list from checkedImagesList if available
    const images =
        checkedImagesList.length > 0
            ? checkedImagesList.map((item, index) => ({
                  name: `Image ${index + 1}`,
                  src: item || `/anime${index + 1}.png`,
              }))
            : [
                  { name: 'Sketch Art', src: '/anime1.png' },
                  { name: 'Watercolor', src: '/anime2.png' },
                  { name: 'Pixel Art', src: '/anime3.png' },
                  { name: 'Cyberpunk', src: '/anime.png' },
                  { name: 'Painting', src: '/anime5.png' },
                  { name: 'Anime', src: '/anime6.png' },
                  { name: 'Fantasy', src: '/anime7.png' },
                  { name: 'Cartoon', src: '/anime8.png' },
              ];

    const [iconsState, setIconsState] = useState<{ [key in IconKeys]: string }>({
        iconStyle: 'styleRed',
        iconRatio: 'ratioWhite',
        iconLayout: 'layoutWhite',
        iconDelete: 'deleteWhite',
        iconCutVideo: 'cutVideoWhite',
        iconCutImage: 'cutImageWhite',
        iconAdjust: 'adjustWhite',
        iconSound: 'soundWhite',
        iconCaption: 'captionWhite',
        iconPrompt: 'promptWhite',
    });

    const ratioImages = [
        { name: '1:1', src: '/ratio_1_1_white.png' },
        { name: '16:9', src: '/ratio_16_9_white.png' },
        { name: '3:4', src: '/ratio_3_4_white.png' },
        { name: '9:16', src: '/ratio_9_16_white.png' },
        { name: '4:5', src: '/ratio_4_5_white.png' },
        { name: '4:3', src: '/ratio_4_3_white.png' },
        { name: '21:9', src: '/ratio_21_9_white.png' },
        { name: '3:2', src: '/ratio_3_2_white.png' },
    ];

    const handleIconClick = (iconName: IconKeys) => {
        setIconsState((prevState) => {
            const newIconsState = { ...prevState };

            // Logic cho việc thay đổi màu sắc của icon
            if (iconName !== 'iconDelete') {
                Object.keys(prevState).forEach((key) => {
                    if (key === iconName) {
                        if (prevState[key as IconKeys].includes('Red')) return;
                        newIconsState[key as IconKeys] = prevState[key as IconKeys].includes('White')
                            ? prevState[key as IconKeys].replace('White', 'Red')
                            : prevState[key as IconKeys].replace('Red', 'White');
                    } else {
                        if (prevState[key as IconKeys].includes('Red')) {
                            newIconsState[key as IconKeys] = prevState[key as IconKeys].replace('Red', 'White');
                        }
                    }
                });
            }

            return newIconsState;
        });

        // Thay đổi selectedIcon nếu không phải iconDelete và iconCutVideo
        if (iconName !== 'iconDelete') {
            setSelectedIcon(iconName);
        }
    };

    const handleRatioClick = (ratioName: string) => {
        setSelectedRatio(ratioName);
        setWidth(height * ratioMap[ratioName]);
    };

    const handleImageClick = (src: string) => {
        setSelectedImage(src);
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setVolume(Number(e.target.value));
    };

    const handleMusicFileChange = async (file: File) => {
        setMusicFile(file);
        const formData = new FormData();
        const blob = new Blob([file], { type: file.type });
        formData.append('voice', blob, `bgmusic_${Date.now()}.mp3`);

        // Upload file lên server
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/voice/upload-bgmusic`, {
            method: 'POST',
            body: formData,
        });
        const data = await response.json();
        console.log('Music file upload response:', data);
        console.log(file);
        if (data.success) {
            setMusicFileName(`${import.meta.env.VITE_BACKEND_URL}${data.path}`);
        }
    };

    const handleMusicFileRemove = () => {
        setMusicFile(null);
        setMusicFileName('');
    };

    const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSpeed(Number(e.target.value));
    };

    const handleBrightnessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setBrightness(Number(e.target.value));
    };

    const handleContrastChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setContrast(Number(e.target.value));
    };

    const handleExposureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setExposure(Number(e.target.value));
    };

    const handleTemperatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTemperature(Number(e.target.value));
    };

    const handleSaturationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSaturation(Number(e.target.value));
    };

    const handleBlurChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setBlur(Number(e.target.value));
    };

    const handleVignetteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setVignette(Number(e.target.value));
    };

    const handleClarityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setClarity(Number(e.target.value));
    };

    const handleFlipVerticalClick = () => {
        setFlippedVertically((prev) => !prev);
        setIconFlipColor('/iconFlipVerticalGreen.png');
        setTimeout(() => {
            setIconFlipColor('/iconFlipVerticalWhite.png');
        }, 400);
    };

    const handleRotateClick = () => {
        setRotated((prev) => !prev);
        setIconRotateColor('/iconRotateGreen.png');
        setTimeout(() => {
            setIconRotateColor('/iconRotateWhite.png');
        }, 400);
    };

    const handleContentStyleClick = (style: string) => {
        setSelectedContentStyles((prev) => (prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]));
    };

    // Function to swap segments with previous index
    const handleSwapLeft = (index: number) => {
        if (index > 0) {
            // Swap in scriptSegments
            const newScriptSegments = [...scriptSegments];
            [newScriptSegments[index], newScriptSegments[index - 1]] = [
                newScriptSegments[index - 1],
                newScriptSegments[index],
            ];
            setScriptSegments(newScriptSegments);

            // Swap in checkedImagesList
            const newCheckedImagesList = [...checkedImagesList];
            [newCheckedImagesList[index], newCheckedImagesList[index - 1]] = [
                newCheckedImagesList[index - 1],
                newCheckedImagesList[index],
            ];
            setCheckedImagesList(newCheckedImagesList);

            // Swap in voicesList
            const newVoicesList = [...voicesList];
            [newVoicesList[index], newVoicesList[index - 1]] = [newVoicesList[index - 1], newVoicesList[index]];
            setVoicesList(newVoicesList);

            setSelectedSegmentIndex(index - 1);
        }
    };

    // Function to swap segments with next index
    const handleSwapRight = (index: number) => {
        if (index < scriptSegments.length - 1) {
            // Swap in scriptSegments
            const newScriptSegments = [...scriptSegments];
            [newScriptSegments[index], newScriptSegments[index + 1]] = [
                newScriptSegments[index + 1],
                newScriptSegments[index],
            ];
            setScriptSegments(newScriptSegments);

            // Swap in checkedImagesList
            const newCheckedImagesList = [...checkedImagesList];
            [newCheckedImagesList[index], newCheckedImagesList[index + 1]] = [
                newCheckedImagesList[index + 1],
                newCheckedImagesList[index],
            ];
            setCheckedImagesList(newCheckedImagesList);

            // Swap in voicesList
            const newVoicesList = [...voicesList];
            [newVoicesList[index], newVoicesList[index + 1]] = [newVoicesList[index + 1], newVoicesList[index]];
            setVoicesList(newVoicesList);

            setSelectedSegmentIndex(index + 1);
        }
    };

    useEffect(() => {
        const updateSize = () => {
            if (introImageRef.current) {
                const element = introImageRef.current;
                const newHeight = element.offsetHeight; // Lấy chiều cao thực tế
                setHeight(newHeight);
                setWidth(newHeight * ratioMap[selectedRatio]); // Cập nhật width theo height
            }
        };

        setTimeout(updateSize, 100); // Delay để đảm bảo lấy đúng kích thước

        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, [selectedRatio]);

    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleCreateVideo = async () => {
        setIsLoading(true);
        try {
            // Create config object from current state
            const images = scriptSegments.map((segment, index) => {
                type ImageObj = {
                    path: string;
                    subtitle: string;
                    audioPath?: string;
                    effects?: {
                        brightness?: number;
                        contrast?: number;
                        rotate?: number;
                        blur?: number;
                    };
                    fade?: boolean;
                };
                const imageObj: ImageObj = {
                    path: checkedImagesList[index] || `${import.meta.env.VITE_BACKEND_URL}/videos/images/i1.jpg`,
                    subtitle: segment,
                };

                // Add audioPath if available
                if (voicesList[index]) {
                    imageObj.audioPath = voicesList[index];
                }

                // Add effects if any adjustments were made
                if (
                    brightness !== 50 ||
                    contrast !== 50 ||
                    exposure !== 50 ||
                    temperature !== 50 ||
                    saturation !== 50 ||
                    blur > 0 ||
                    vignette !== 50 ||
                    clarity !== 50 ||
                    rotated ||
                    flippedVertically
                ) {
                    imageObj.effects = {};

                    // Chỉ thêm các effect có giá trị khác mặc định
                    if (brightness !== 50) {
                        imageObj.effects.brightness = (brightness - 50) / 50; // Convert to -1 to 1 range
                    }

                    if (contrast !== 50) {
                        imageObj.effects.contrast = contrast / 50; // Convert to 0 to 2 range
                    }

                    // if (saturation !== 50) {
                    //     imageObj.effects.saturation = saturation / 50; // Convert to 0 to 2 range
                    // }

                    imageObj.fade = true;
                    // Add rotation if applied
                    if (rotated) {
                        imageObj.effects.rotate = 180;
                    }
                    if (blur > 0) {
                        imageObj.effects.blur = blur / 10; // Convert to 0 to 5 range
                    }
                }

                return imageObj;
            });

            console.log('CHECK IMAGES IN EDITVIDEO BEFORE CALL API CREATE VIDEO: ', images);
            const config = {
                images,
                resolution: getResolutionFromRatio(selectedRatio),
                videoDuration: 5,
                backgroundMusic: musicFileName,
                backgroundMusicVolume: volume / 100,
                cleanupTemp: false,
            };

            // Call API to create video
            const response = await post('/video/create', { config, videoId: promptId });

            if (!response) {
                throw new Error('Failed to create video');
            }

            // Handle response based on its type
            let data;
            if (response.json && typeof response.json === 'function') {
                data = await response.json();
            } else {
                data = response; // Response is already JSON
            }

            console.log('Video creation response:', data);

            // Navigate to export video with the video URL
            if (data.outputPath) {
                navigate('/export-video', { state: { videoUrl: data.outputPath, videoId: promptId } });
            } else {
                throw new Error('No video URL received from server');
            }
        } catch (error) {
            console.error('Error creating video:', error);
            alert('Failed to create video. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Helper function to get resolution based on ratio
    const getResolutionFromRatio = (ratio: string): { width: number; height: number } => {
        switch (ratio) {
            case '16:9':
                return { width: 1920, height: 1080 };
            case '1:1':
                return { width: 1080, height: 1080 };
            case '9:16':
                return { width: 1080, height: 1920 };
            case '4:5':
                return { width: 1080, height: 1350 };
            case '3:4':
                return { width: 1080, height: 1440 };
            case '4:3':
                return { width: 1440, height: 1080 };
            case '21:9':
                return { width: 2560, height: 1080 };
            case '3:2':
                return { width: 1620, height: 1080 };
            default:
                return { width: 1920, height: 1080 };
        }
    };

    //quay lại create video và vẫn giữ các thông tin cũ:
    const backToEditPage = () => {
        const hasFetchedPromptId: boolean = true;
        navigate('/create-video', {
            state: {
                scriptSegments,
                checkedImagesList,
                voicesList,
                hasFetchedPromptId,
                selectedLiterature,

                //các id của phiên làm việc:
                promptId,
                scriptPromptId,
                voicePromptId,
                imagePromptId,
            },
        });
    };

    return (
        <div className={styles.container}>
            <FloatingParticles />
            <div className={styles.header}>
                <div className={styles.left}>
                    <button onClick={backToEditPage} className={styles.backButton}>
                        <img src="/arrow_left_black.png" alt="Back" className={styles.arrowIcon} />
                    </button>
                    <span className={styles.title}>Edit Video</span>
                </div>

                <HeaderCategory selectedIcon={selectedIcon} />
            </div>
            <div className={styles.body}>
                <div className={styles.leftPanel}>
                    <div ref={introImageRef} className={styles.introImageWrapper} style={{ width }}>
                        <img
                            src={selectedImage || '/anime.png'}
                            alt="Preview"
                            className={`${styles.previewImage} ${flippedVertically ? styles.flipped : ''} ${
                                rotated ? styles.rotated : ''
                            }`}
                        />
                        <button className={styles.pauseButton}>
                            <img src="/pause.png" alt="Pause" className={styles.pauseIcon} />
                        </button>
                    </div>
                </div>

                <div className={styles.rightPanel}>
                    {selectedIcon === 'iconLayout' ? (
                        <div className={styles.soundAndSpeed}></div>
                    ) : selectedIcon === 'iconCaption' ? (
                        <CaptionEdit caption={caption} setCaption={setCaption} />
                    ) : selectedIcon === 'iconPrompt' ? (
                        <PromptEdit
                            newPrompt={newPrompt}
                            setnewPrompt={setnewPrompt}
                            selectedContentStyles={selectedContentStyles}
                            handleContentStyleClick={handleContentStyleClick}
                        />
                    ) : selectedIcon === 'iconSound' ? (
                        <SoundAndSpeed
                            volume={volume}
                            handleVolumeChange={handleVolumeChange}
                            speed={speed}
                            handleSpeedChange={handleSpeedChange}
                            musicFile={musicFile}
                            handleMusicFileChange={handleMusicFileChange}
                            handleMusicFileRemove={handleMusicFileRemove}
                        />
                    ) : selectedIcon === 'iconCutImage' ? (
                        <ImageEdit
                            iconFlipColor={iconFlipColor}
                            handleFlipVerticalClick={handleFlipVerticalClick}
                            iconRotateColor={iconRotateColor}
                            handleRotateClick={handleRotateClick}
                        />
                    ) : selectedIcon === 'iconAdjust' ? (
                        <ImageAdjustment
                            brightness={brightness}
                            handleBrightnessChange={handleBrightnessChange}
                            contrast={contrast}
                            handleContrastChange={handleContrastChange}
                            exposure={exposure}
                            handleExposureChange={handleExposureChange}
                            temperature={temperature}
                            handleTemperatureChange={handleTemperatureChange}
                            saturation={saturation}
                            handleSaturationChange={handleSaturationChange}
                            blur={blur}
                            handleBlurChange={handleBlurChange}
                            vignette={vignette}
                            handleVignetteChange={handleVignetteChange}
                            clarity={clarity}
                            handleClarityChange={handleClarityChange}
                        />
                    ) : (
                        <div className={selectedIcon === 'iconRatio' ? styles.ratioGrid : styles.imageGrid}>
                            {selectedIcon === 'iconRatio'
                                ? ratioImages.map((ratio, idx) => {
                                      const isSelected = selectedRatio === ratio.name;
                                      return (
                                          <div
                                              key={idx}
                                              className={styles.imageStyleItem}
                                              onClick={() => handleRatioClick(ratio.name)}
                                          >
                                              <img
                                                  src={isSelected ? ratio.src.replace('white', 'green') : ratio.src}
                                                  alt={ratio.name}
                                              />
                                              <p className={isSelected ? styles.selectedRatioText : styles.imageText}>
                                                  {ratio.name}
                                              </p>
                                          </div>
                                      );
                                  })
                                : images.map((style, idx) => (
                                      <div
                                          key={idx}
                                          className={`${styles.imageItem} ${
                                              selectedImage === style.src ? styles.selected : ''
                                          }`}
                                          onClick={() => handleImageClick(style.src)}
                                      >
                                          <img
                                              src={style.src}
                                              alt={style.name}
                                              className={`${styles.styleImageInImages} ${
                                                  selectedImage === style.src ? styles.selected : ''
                                              }`}
                                          />
                                      </div>
                                  ))}
                        </div>
                    )}
                </div>
            </div>

            <div className={styles.timeline}>
                <div className={styles.leftTimeline}>
                    {selectedIcon === 'iconCutVideo' ? (
                        <div className={styles.timelineTracks}>
                            {/* Script Track */}
                            <div className={styles.timelineTrack}>
                                <div className={styles.trackLabel}>Script</div>
                                <div className={styles.trackContent}>
                                    {scriptSegments.map((segment, index) => (
                                        <div
                                            key={`script-${index}`}
                                            className={clsx(styles.segment, {
                                                [styles.selectedSegment]: index === selectedSegmentIndex,
                                            })}
                                            onClick={() => setSelectedSegmentIndex(index)}
                                        >
                                            <div className={styles.segmentContent}>{segment.substring(0, 30)}...</div>
                                            <div className={styles.segmentControls}>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleSwapLeft(index);
                                                    }}
                                                    disabled={index === 0}
                                                    className={styles.swapButton}
                                                >
                                                    ←
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleSwapRight(index);
                                                    }}
                                                    disabled={index === scriptSegments.length - 1}
                                                    className={styles.swapButton}
                                                >
                                                    →
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Images Track */}
                            <div className={styles.timelineTrack}>
                                <div className={styles.trackLabel}>Images</div>
                                <div className={styles.trackContent}>
                                    {checkedImagesList.map((imageData, index) => (
                                        <div
                                            key={`image-${index}`}
                                            className={clsx(styles.segment, {
                                                [styles.selectedSegment]: index === selectedSegmentIndex,
                                            })}
                                            onClick={() => setSelectedSegmentIndex(index)}
                                        >
                                            <div className={styles.segmentContent}>
                                                <img
                                                    src={imageData[0]}
                                                    alt={`Segment ${index}`}
                                                    className={styles.segmentImage}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Voice Track */}
                            <div className={styles.timelineTrack}>
                                <div className={styles.trackLabel}>Voice</div>
                                <div className={styles.trackContent}>
                                    {voicesList.map((voice, index) => (
                                        <div
                                            key={`voice-${index}`}
                                            className={clsx(styles.segment, {
                                                [styles.selectedSegment]: index === selectedSegmentIndex,
                                            })}
                                            onClick={() => setSelectedSegmentIndex(index)}
                                        >
                                            <div className={styles.segmentContent}>
                                                <div className={styles.voiceWaveform}>
                                                    {/* Placeholder for voice waveform visualization */}♪ Voice{' '}
                                                    {index + 1}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className={styles.timelineTrack}>
                            {finalTimeline.map((marker, index) => (
                                <span key={index} className={styles.timelineMarker}>
                                    {marker}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
                <div className={styles.rightTimeline}></div>
            </div>

            <div className={clsx(styles.editVideoList)}>
                <div className={styles.leftSide}>
                    <div className={styles.functionIcon}>
                        {Object.keys(iconsState).map((iconKey) => {
                            const iconSrc = iconsState[iconKey as IconKeys].includes('Red')
                                ? `/${iconKey}Red.png`
                                : `/${iconKey}White.png`;
                            return (
                                <div key={iconKey} className={styles.iconItem}>
                                    <img
                                        src={iconSrc}
                                        alt={iconKey}
                                        className={styles.icon}
                                        onClick={() => handleIconClick(iconKey as IconKeys)}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className={clsx(styles.rightSide)}>
                    <div className={clsx(styles.nextButtonWrapper)}>
                        <button
                            className={clsx(styles.nextButton, { [styles.disabled]: isLoading })}
                            onClick={handleCreateVideo}
                            disabled={isLoading}
                        >
                            {/* {isLoading ? (
                                <span className={styles.loader}></span>
                            ) : (
                                <img src="/arrow_right.png" alt="Next" className={clsx(styles.nextIcon)} />
                            )} */}
                            <img src="/arrow_right.png" alt="Next" className={clsx(styles.nextIcon)} />
                        </button>
                    </div>
                </div>
            </div>

            {isLoading && (
                <LoadingComponent
                    customClassName={clsx('position-fixed', 'top-50', 'start-50', 'translate-middle')}
                    description="Video của bạn đang được tạo ..."
                    isOverlay={isLoading}
                />
            )}
        </div>
    );
};

export default EditVideo;
