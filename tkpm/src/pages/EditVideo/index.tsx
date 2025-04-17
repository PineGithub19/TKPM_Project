import React, { useState, useRef, useEffect } from 'react';
import styles from './EditVideo.module.css';
import { useNavigate, useLocation } from 'react-router-dom';
import FloatingParticles from '../CreateVideo/CreateVideoComponents/FloatingParticles/FloatingParticles';
import clsx from 'clsx';
import { post } from '../../utils/request';

interface LocationState {
    scriptSegments?: string[];
    checkedImagesList?: string[];
    voicesList?: string[];
}

const contentStyleOptions = [
    'Analytical',
    'Narrative',
    'Modern',
    'Poetic Illustration',
    'Classic',
    'Storytelling',
    'Dramatic',
    'Satirical',
];
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

    const [selectedSegmentIndex, setSelectedSegmentIndex] = useState<number>(0);

    const [selectedIcon, setSelectedIcon] = useState<IconKeys>('iconStyle');
    const [selectedRatio, setSelectedRatio] = useState<string>('16:9');

    const introImageRef = useRef<HTMLDivElement | null>(null);

    const [height, setHeight] = useState<number>(0);
    const [width, setWidth] = useState<number>(0);

    const [volume, setVolume] = useState(50);
    const [speed, setSpeed] = useState(50);

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

    // Log data from CreateVideo if needed
    useEffect(() => {
        console.log('Received from CreateVideo:', {
            scriptSegments,
            checkedImagesList,
            voicesList,
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
            ? checkedImagesList.slice(0, 8).map((item, index) => ({
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

    const [loading, setLoading] = useState<boolean>(false);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);

    const handleCreateVideo = async () => {
        setLoading(true);
        try {
            // Create config object from current state
            const images = scriptSegments.map((segment, index) => {
                const imageObj: any = {
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
                backgroundMusic: `${import.meta.env.VITE_BACKEND_URL}/video/audios/background.mp3`,
                backgroundMusicVolume: volume / 100,
                cleanupTemp: false,
            };

            // Call API to create video
            const response = await post('/video/create', { config });

            if (!response) {
                throw new Error('Failed to create video');
            }

            const data = await response.json();
            setVideoUrl(data.videoUrl);

            // Navigate to export video with the video URL
            if (response.status === 200) navigate('/export-video', { state: { videoUrl: data.videoUrl } });
        } catch (error) {
            console.error('Error creating video:', error);
            alert('Failed to create video. Please try again.');
        } finally {
            setLoading(false);
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

    return (
        <div className={styles.container}>
            <FloatingParticles />
            <div className={styles.header}>
                <div className={styles.left}>
                    <button onClick={() => navigate('/create-video')} className={styles.backButton}>
                        <img src="/arrow_left_black.png" alt="Back" className={styles.arrowIcon} />
                    </button>
                    <span className={styles.title}>Edit Video</span>
                </div>

                <div className={styles.right}>
                    {selectedIcon === 'iconRatio' ? (
                        <span className={styles.editCategory}>Ratio</span>
                    ) : selectedIcon === 'iconSound' ? (
                        <span className={styles.editCategory}>Sound And Speed</span>
                    ) : selectedIcon === 'iconAdjust' ? (
                        <span className={styles.editCategory}>Image Adjustment</span>
                    ) : selectedIcon === 'iconCutImage' ? (
                        <span className={styles.editCategory}>Image Edit</span>
                    ) : selectedIcon === 'iconLayout' ? (
                        <span className={styles.editCategory}>Image Layout</span>
                    ) : selectedIcon === 'iconCaption' ? (
                        <span className={styles.editCategory}>Caption Edit</span>
                    ) : selectedIcon === 'iconPrompt' ? (
                        <span className={styles.editCategory}>New Prompt</span>
                    ) : (
                        <span className={styles.editCategory}>Images</span>
                    )}
                </div>
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
                        <div className={styles.captionEdit}>
                            <div className={styles.captionText}>
                                <textarea
                                    className={clsx(styles.input_text)}
                                    placeholder="Enter caption"
                                    value={caption}
                                    onChange={(e) => setCaption(e.target.value)}
                                ></textarea>
                                <img src="/iconCheck.png" alt="Check Icon" className={styles.iconCheck} />
                            </div>
                            <div className={styles.captionStyle}>
                                <span className={styles.titleCaption}>Caption Style</span>
                                <div className={styles.formatStyle}>
                                    <img src="/iconBold.png" alt="Bold Icon" className={styles.iconFormat} />
                                    <img src="/iconItalic.png" alt="Italic Icon" className={styles.iconFormat} />
                                    <img src="/iconUnderline.png" alt="Underline Icon" className={styles.iconFormat} />
                                </div>
                            </div>
                            <div className={styles.captionStyle}>
                                <div className={styles.titleAutomatic}>
                                    <span className={styles.titleCaption}>Automatic subtitles</span>
                                    <img
                                        src="/iconStar.png"
                                        alt="Automatic Subtitles Icon"
                                        className={styles.iconAutomaticSubtitles}
                                    />
                                </div>

                                <div className={styles.formatStyle}>
                                    <img
                                        src="/iconAutomaticSubtitles.png"
                                        alt="Automatic Subtitles Icon"
                                        className={styles.iconFormat}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : selectedIcon === 'iconPrompt' ? (
                        <div className={styles.soundAndSpeed}>
                            <div className={styles.captionEdit}>
                                <div className={styles.captionText}>
                                    <textarea
                                        className={clsx(styles.input_text)}
                                        placeholder="Enter new prompt"
                                        value={newPrompt}
                                        onChange={(e) => setnewPrompt(e.target.value)}
                                    ></textarea>
                                </div>
                                <div className={styles.contentStyle}>
                                    <span className={styles.titleCaption}>Content Style</span>
                                    <div className={styles.formatContentStyle}>
                                        <div className={`${styles.style_buttons} content`}>
                                            {contentStyleOptions.map((style) => (
                                                <button
                                                    key={style}
                                                    onClick={() => handleContentStyleClick(style)}
                                                    className={clsx(styles.style_button, {
                                                        [styles.activeContent]: selectedContentStyles.includes(style),
                                                    })}
                                                >
                                                    {style}
                                                </button>
                                            ))}
                                        </div>
                                        <div className={styles.style_recreate}>
                                            <button className={styles.style_button_recreate}>Recreate</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : selectedIcon === 'iconSound' ? (
                        <div className={styles.soundAndSpeed}>
                            <div className={styles.soundControl}>
                                <img src="/iconVolumn.png" alt="Listen Icon" className={styles.soundIcon} />
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={volume}
                                    onChange={handleVolumeChange}
                                    className={styles.volumeSlider}
                                />
                            </div>

                            <div className={styles.soundControl}>
                                <img src="/iconSpeed.png" alt="Speed Icon" className={styles.soundIcon} />
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={speed}
                                    onChange={handleSpeedChange}
                                    className={styles.volumeSlider}
                                />
                            </div>
                        </div>
                    ) : selectedIcon === 'iconCutImage' ? (
                        <div className={styles.imageEdit}>
                            <img
                                src={iconFlipColor}
                                alt="Flip Vertical Icon"
                                className={styles.soundIcon}
                                onClick={handleFlipVerticalClick}
                            />
                            <img
                                src={iconRotateColor}
                                alt="Rotate Icon"
                                className={styles.soundIcon}
                                onClick={handleRotateClick}
                            />
                        </div>
                    ) : selectedIcon === 'iconAdjust' ? (
                        <div className={styles.soundAndSpeed}>
                            <div className={styles.soundControl}>
                                <img src="/iconBrightness.png" alt="Brightness Icon" className={styles.soundIcon} />
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={brightness}
                                    onChange={handleBrightnessChange}
                                    className={styles.volumeSlider}
                                />
                            </div>

                            <div className={styles.soundControl}>
                                <img src="/iconContrast.png" alt="Contrast Icon" className={styles.soundIcon} />
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={contrast}
                                    onChange={handleContrastChange}
                                    className={styles.volumeSlider}
                                />
                            </div>

                            <div className={styles.soundControl}>
                                <img src="/iconExposure.png" alt="Exposure Icon" className={styles.soundIcon} />
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={exposure}
                                    onChange={handleExposureChange}
                                    className={styles.volumeSlider}
                                />
                            </div>

                            <div className={styles.soundControl}>
                                <img src="/iconTemperature.png" alt="Temperature Icon" className={styles.soundIcon} />
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={temperature}
                                    onChange={handleTemperatureChange}
                                    className={styles.volumeSlider}
                                />
                            </div>

                            <div className={styles.soundControl}>
                                <img src="/iconSaturation.png" alt="Saturation Icon" className={styles.soundIcon} />
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={saturation}
                                    onChange={handleSaturationChange}
                                    className={styles.volumeSlider}
                                />
                            </div>

                            <div className={styles.soundControl}>
                                <img src="/iconBlur.png" alt="Blur Icon" className={styles.soundIcon} />
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={blur}
                                    onChange={handleBlurChange}
                                    className={styles.volumeSlider}
                                />
                            </div>

                            <div className={styles.soundControl}>
                                <img src="/iconVignette.png" alt="Vignette Icon" className={styles.soundIcon} />
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={vignette}
                                    onChange={handleVignetteChange}
                                    className={styles.volumeSlider}
                                />
                            </div>

                            <div className={styles.soundControl}>
                                <img src="/iconClarity.png" alt="Clarity Icon" className={styles.soundIcon} />
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={clarity}
                                    onChange={handleClarityChange}
                                    className={styles.volumeSlider}
                                />
                            </div>
                        </div>
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

            <div className={styles.editVideoList}>
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
                            className={clsx(styles.nextButton, { [styles.disabled]: loading })}
                            onClick={handleCreateVideo}
                            disabled={loading}
                        >
                            {loading ? (
                                <span className={styles.loader}></span>
                            ) : (
                                <img src="/arrow_right.png" alt="Next" className={clsx(styles.nextIcon)} />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditVideo;
