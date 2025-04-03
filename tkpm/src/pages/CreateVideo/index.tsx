import { useEffect, useState, useRef } from 'react';
import clsx from 'clsx';
import styles from './CreateVideo.module.css';
import StepBar from './CreateVideoComponents/StepBar/StepBar';
import PromptBody from './CreateVideoComponents/PromptBody/PromptBody';
import Literature from '../Literature';
import ScriptAutoGenerate from '../ScriptAutoGenerate';
import GenerateVoice from '../GenerateVoice';
import ImagePrompt from '../ImagePrompt';

import * as request from '../../utils/request';

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
        <div className={clsx(styles.background)}>
            <div className={clsx('container', 'd-flex', 'justify-space-between', styles.layoutConfig)}>
                <StepBar
                    steps={steps}
                    activeStep={activeStep}
                    handleNext={handleNext}
                    handleBack={handleBack}
                    handleReset={handleReset}
                />
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
}

export default CreateVideo;
