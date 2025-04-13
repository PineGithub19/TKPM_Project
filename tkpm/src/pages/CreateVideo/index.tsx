import { useEffect, useState, useRef } from 'react';
import styles from './CreateVideo.module.css';
import StepBar from './CreateVideoComponents/StepBar/StepBar';
import FloatingParticles from './CreateVideoComponents/FloatingParticles/FloatingParticles';
import PromptBody from './CreateVideoComponents/PromptBody/PromptBody';
import Literature from '../Literature';
import ScriptAutoGenerate from '../ScriptAutoGenerate';
import GenerateVoice from '../GenerateVoice';
import ImagePrompt from '../ImagePrompt';
import * as request from '../../utils/request';
import clsx from "clsx";
import axios from "axios";

const steps = [
    {
        label: 'Select Literature',
        description: `Find and select a literary work to use as the basis for your video.`,
    },
    {
        label: 'Generate Script',
        description: 'Configure and generate a script based on the selected literature.',
    },
    {
        label: 'Create Voice Narration',
        description: 'Generate voice narrations for each segment of your script.',
    },
    {
        label: 'Create Images for Video',
        description: 'Generate images for your video based on the script segments.',
    },
    {
        label: 'Create Video',
        description: 'Generate video from previous data. Enjoy your process <3',
    },
];

interface ImagesListComplete {
    images: string[];
    segment: string;
}

function CreateVideo() {
    const [promptId, setPromptId] = useState<string>('');
    const [activeStep, setActiveStep] = useState(0);
    const hasFetchedPromptId = useRef(false);
    const [selectedLiterature, setSelectedLiterature] = useState<{ content: string; title: string } | null>(null);

    const [scriptSegments, setScriptSegments] = useState<string[]>([]); // string array of headers
    const [scriptTitle, setScriptTitle] = useState<string>('');

    const [checkedImagesList, setCheckedImagesList] = useState<ImagesListComplete[]>([]);


// const contentStyleOptions = ["Analytical", "Narrative", "Poetic Illustration", "Classic", "Storytelling", "Dramatic", "Satirical", "Modern"];
// const voiceStyleOptions = ["ElevenLabs", "Google TTS", "Amazon Polly"];
// const voiceGenderOptions = ["Female", "Male"];

// const CreateVideo: React.FC = () => {
//     const [selectedContentStyles, setSelectedContentStyles] = useState<string[]>([]);
//     const [selectedVoiceStyle, setSelectedVoiceStyle] = useState<string>(voiceStyleOptions[0]);
//     const [selectedVoiceGender, setSelectedVoiceGender] = useState<string>(voiceGenderOptions[0]);

//     const [speed, setSpeed] = useState<number>(50);
//     const [tone, setTone] = useState<number>(50);
//     const [intensity, setIntensity] = useState<number>(50);

//     const [prompt, setPrompt] = useState<string>("");
//     const [generatedImage, setGeneratedImage] = useState<string>("");
//     const [loading, setLoading] = useState<boolean>(false);

//     const handleContentStyleClick = (style: string) => {
//         setSelectedContentStyles((prev) =>
//             prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]
//         );
//     };
    const handleNext = () => {
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
    };
    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const handleReset = () => {
        setActiveStep(0);
    };

    const handleLiteratureSelected = (content: string, title: string) => {
        setSelectedLiterature({ content, title });
        handleNext(); // Move to the next step (ScriptAutoGenerate)
    };

    const handleScriptComplete = (segments: string[], title: string) => {
        setScriptSegments(segments);
        setScriptTitle(title);
        handleNext(); // Move to the next step (GenerateVoice)
    };

    const handleVoiceComplete = () => {
        handleNext(); // Move to the image generation step
    };

    const handleCheckedImagesListComplete = (images: ImagesListComplete[]) => {
        setCheckedImagesList(images);
    };


    useEffect(() => {
        if (!hasFetchedPromptId.current) {
            async function fetchPromptId() {
                const response = await request.post('/information/create');
                setPromptId(response?.id || '');
            }
            fetchPromptId();
            hasFetchedPromptId.current = true;
        }
    }, []);

    useEffect(() => {
        if (checkedImagesList.length > 0) console.log(checkedImagesList);
    }, [checkedImagesList]);

    return (
        <div className={clsx(styles.container)}>
            <FloatingParticles />
                <div className={clsx(styles.left)}>
                    <StepBar
                        steps={steps}
                        activeStep={activeStep}
                        handleNext={handleNext}
                        handleBack={handleBack}
                        handleReset={handleReset}
                    />
                </div>
                <div className={clsx(styles.right)}>
                    <PromptBody>
                        {activeStep === 0 && (
                            <div className="create-video-literature-container">
                                <Literature onSelectLiterature={handleLiteratureSelected} />
                            </div>
                        )}
                        {activeStep === 1 && selectedLiterature && (
                            <div className="create-video-script-container">
                                <ScriptAutoGenerate
                                    literatureContent={selectedLiterature.content}
                                    literatureTitle={selectedLiterature.title}
                                    onComplete={handleScriptComplete}
                                />
                            </div>
                        )}
                        {activeStep === 2 && (
                            <div className="create-video-voice-container">
                                <GenerateVoice
                                    scriptSegments={scriptSegments}
                                    scriptTitle={scriptTitle}
                                    onComplete={handleVoiceComplete}
                                />
                            </div>
                        )}
                        {activeStep === 3 && (
                            <div className="create-video-image-container">
                                <ImagePrompt
                                    promptId={promptId}
                                    scriptSegments={scriptSegments}
                                    handleCheckedImagesListComplete={handleCheckedImagesListComplete}
                                />
                            </div>
                        )}
                        {activeStep === 4 && (
                            <div className="create-video-container">
                                <h1>Create Video Here!</h1>
                            </div>
                        )}
                    </PromptBody>
                </div>
        </div>
    );
};

export default CreateVideo;

// return (
    //     <div className={clsx(styles.container)}>
    //         <div className={clsx(styles.left)}>
    //             <h1 className={clsx(styles.title)}>Create a video from text prompt</h1>
    //             <textarea
    //                 className={clsx(styles.input_text)}
    //                 placeholder="Enter your prompt or choose literary theme"
    //                 value={prompt}
    //                 onChange={(e) => setPrompt(e.target.value)}
    //             ></textarea>

    //             <h2 className={clsx(styles.contentStyle)}>Content Style</h2>
    //             <div className={`${styles.style_buttons} content`}>
    //                 {contentStyleOptions.map((style) => (
    //                     <button
    //                         key={style}
    //                         onClick={() => handleContentStyleClick(style)}
    //                         className={clsx(styles.style_button, {
    //                             [styles.activeContent]: selectedContentStyles.includes(style),
    //                         })}
    //                     >
    //                         {style}
    //                     </button>
    //                 ))}
    //             </div>

    //             <h2 className={clsx(styles.voiceStyle)}>Voice Style</h2>
    //             <div className={`${styles.style_buttons} voice`}>
    //                 {voiceStyleOptions.map((style) => (
    //                     <button
    //                         key={style}
    //                         onClick={() => setSelectedVoiceStyle(style)}
    //                         className={clsx(styles.style_button, {
    //                             [styles.activeVoice]: selectedVoiceStyle === style,
    //                         })}
    //                     >
    //                         {style}
    //                     </button>
    //                 ))}
    //             </div>

    //             <h2 className={clsx(styles.voiceGender)}>Voice Gender</h2>
    //             <div className={`${styles.style_buttons} voiceGender`}>
    //                 {voiceGenderOptions.map((style) => (
    //                     <button
    //                         key={style}
    //                         onClick={() => setSelectedVoiceGender(style)}
    //                         className={clsx(styles.style_button, {
    //                             [styles.activeVoiceGender]: selectedVoiceGender === style,
    //                         })}
    //                     >
    //                         {style}
    //                     </button>
    //                 ))}
    //             </div>

    //             <h2 className={clsx(styles.sliderTitle)}>Voice Controls</h2>
    //             <div className={clsx(styles.sliders)}>
    //                 <div className={clsx(styles.sliderWrapper)}>
    //                     <label className={clsx(styles.sliderLabel)}>Speed</label>
    //                     <input
    //                         type="range"
    //                         min="0"
    //                         max="100"
    //                         value={speed}
    //                         onChange={(e) => setSpeed(Number(e.target.value))}
    //                         className={clsx(styles.slider)}
    //                     />
    //                 </div>
    //                 <div className={clsx(styles.sliderWrapper)}>
    //                     <label className={clsx(styles.sliderLabel)}>Tone</label>
    //                     <input
    //                         type="range"
    //                         min="0"
    //                         max="100"
    //                         value={tone}
    //                         onChange={(e) => setTone(Number(e.target.value))}
    //                         className={clsx(styles.slider)}
    //                     />
    //                 </div>
    //                 <div className={clsx(styles.sliderWrapper)}>
    //                     <label className={clsx(styles.sliderLabel)}>Intensity</label>
    //                     <input
    //                         type="range"
    //                         min="0"
    //                         max="100"
    //                         value={intensity}
    //                         onChange={(e) => setIntensity(Number(e.target.value))}
    //                         className={clsx(styles.slider)}
    //                     />
    //                 </div>
    //                 <button className={clsx(styles.previewButton)}>
    //                     Preview voice
    //                     <img src="/voice_recognition.png" alt="Voice Icon" className={clsx(styles.voiceIcon)} />
    //                 </button>
    //             </div>


    //         </div>

    //         <div className={clsx(styles.right)}>
    //             <div className={clsx(styles.introImageWrapper)}>
    //                 {generatedImage ? (
    //                     <img src={generatedImage} alt="Generated" className={clsx(styles.previewImage)} />
    //                 ) : (
    //                     <p>Image will appear here</p>
    //                 )}
    //             </div>

    //             <div className={clsx(styles.nextButtonWrapper)}>
    //                 <button className={clsx(styles.nextButton)}>
    //                     <img src="/arrow_right.png" alt="Next" className={clsx(styles.nextIcon)} />
    //                 </button>
    //             </div>
    //         </div>
    //     </div>
    // );