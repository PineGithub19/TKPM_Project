import React, { useState } from "react";
import styles from './CreateVideo.module.css';
import clsx from "clsx";
// import axios from "axios";
import { useNavigate } from "react-router-dom"; 

const contentStyleOptions = ["Analytical", "Narrative", "Poetic Illustration", "Classic", "Storytelling", "Dramatic", "Satirical", "Modern"];
const voiceStyleOptions = ["ElevenLabs", "Google TTS", "Amazon Polly"];
const voiceGenderOptions = ["Female", "Male"];

const CreateVideo: React.FC = () => {
    const [selectedContentStyles, setSelectedContentStyles] = useState<string[]>([]);
    const [selectedVoiceStyle, setSelectedVoiceStyle] = useState<string>(voiceStyleOptions[0]);
    const [selectedVoiceGender, setSelectedVoiceGender] = useState<string>(voiceGenderOptions[0]);

    const [speed, setSpeed] = useState<number>(50);
    const [tone, setTone] = useState<number>(50);
    const [intensity, setIntensity] = useState<number>(50);
    const navigate = useNavigate();

    const [prompt, setPrompt] = useState<string>("");
    // const [generatedImage, setGeneratedImage] = useState<string>("");
    // const [loading, setLoading] = useState<boolean>(false);

    const handleContentStyleClick = (style: string) => {
        setSelectedContentStyles((prev) =>
            prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]
        );
    };

    // const handleGenerateImage = async () => {
    //     setLoading(true);
    //     try {
    //         const combinedPrompt = `${prompt} with style: ${selectedContentStyles.join(", ")}`;
    //         const response = await axios.post(
    //             "http://localhost:3000/image/generate-replicate",
    //             { prompt: combinedPrompt }
    //         );
            
    
    //         const imageUrl = response.data?.output?.[0] || response.data?.url;
    //         if (!imageUrl) {
    //             console.log("No image URL returned:", response.data);
    //         }
    //         setGeneratedImage(imageUrl);
            
    //     } catch (error) {
    //         console.error("Failed to generate image:", error);
    //         alert("Error generating image");
    //     } finally {
    //         setLoading(false);
    //     }
    // };
    
    return (
        <div className={clsx(styles.container)}>
            <div className={clsx(styles.left)}>
                <h1 className={clsx(styles.title)}>Create a video from text prompt</h1>
                <textarea
                    className={clsx(styles.input_text)}
                    placeholder="Enter your prompt or choose literary theme"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                ></textarea>

                <h2 className={clsx(styles.contentStyle)}>Content Style</h2>
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

                <h2 className={clsx(styles.voiceStyle)}>Voice Style</h2>
                <div className={`${styles.style_buttons} voice`}>
                    {voiceStyleOptions.map((style) => (
                        <button
                            key={style}
                            onClick={() => setSelectedVoiceStyle(style)}
                            className={clsx(styles.style_button, {
                                [styles.activeVoice]: selectedVoiceStyle === style,
                            })}
                        >
                            {style}
                        </button>
                    ))}
                </div>

                <h2 className={clsx(styles.voiceGender)}>Voice Gender</h2>
                <div className={`${styles.style_buttons} voiceGender`}>
                    {voiceGenderOptions.map((style) => (
                        <button
                            key={style}
                            onClick={() => setSelectedVoiceGender(style)}
                            className={clsx(styles.style_button, {
                                [styles.activeVoiceGender]: selectedVoiceGender === style,
                            })}
                        >
                            {style}
                        </button>
                    ))}
                </div>

                <h2 className={clsx(styles.sliderTitle)}>Voice Controls</h2>
                <div className={clsx(styles.sliders)}>
                    <div className={clsx(styles.sliderWrapper)}>
                        <label className={clsx(styles.sliderLabel)}>Speed</label>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={speed}
                            onChange={(e) => setSpeed(Number(e.target.value))}
                            className={clsx(styles.slider)}
                        />
                    </div>
                    <div className={clsx(styles.sliderWrapper)}>
                        <label className={clsx(styles.sliderLabel)}>Tone</label>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={tone}
                            onChange={(e) => setTone(Number(e.target.value))}
                            className={clsx(styles.slider)}
                        />
                    </div>
                    <div className={clsx(styles.sliderWrapper)}>
                        <label className={clsx(styles.sliderLabel)}>Intensity</label>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={intensity}
                            onChange={(e) => setIntensity(Number(e.target.value))}
                            className={clsx(styles.slider)}
                        />
                    </div>
                    <button className={clsx(styles.previewButton)}>
                        Preview voice
                        <img src="/voice_recognition.png" alt="Voice Icon" className={clsx(styles.voiceIcon)} />
                    </button>
                </div>


            </div>

            <div className={clsx(styles.right)}>
                <div className={clsx(styles.introImageWrapper)}>
                    <img src="/anime.png" alt="Anime" className={clsx(styles.previewImage)} />
                </div>

                <div className={clsx(styles.nextButtonWrapper)}>
                    <button className={clsx(styles.nextButton)} onClick={() => navigate('/edit-video')}>
                        <img src="/arrow_right.png" alt="Next" className={clsx(styles.nextIcon)} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateVideo;
