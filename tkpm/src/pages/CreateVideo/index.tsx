import { useEffect, useState, useRef, useCallback } from 'react';
import styles from './CreateVideo.module.css';
import StepBar from './CreateVideoComponents/StepBar/StepBar';
import FloatingParticles from './CreateVideoComponents/FloatingParticles/FloatingParticles';
import PromptBody from './CreateVideoComponents/PromptBody/PromptBody';
import Literature from '../Literature';
import ScriptAutoGenerate from '../ScriptAutoGenerate';
import GenerateVoice from '../GenerateVoice';
import ImagePrompt from '../ImagePrompt';
import WaitingEntertainment from './CreateVideoComponents/WaitingEntertainment/WaitingEntertainment';
import * as request from '../../utils/request';
import clsx from 'clsx';
import { BlockerFunction, useBlocker, Blocker } from 'react-router-dom';
import SweetAlert from '../../components/SweetAlert';

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
        label: 'Create Images for Video',
        description: 'Generate images for your video based on the script segments.',
    },
    {
        label: 'Create Voice Narration',
        description: 'Generate voice narrations for each segment of your script.',
    },
];

interface ImagesListComplete {
    images: string[];
    localImages: string[];
    segment: string;
}

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

function CreateVideo() {
    const [promptId, setPromptId] = useState<string>('');
    const [activeStep, setActiveStep] = useState(0);
    const hasFetchedPromptId = useRef(false);
    const [selectedLiterature, setSelectedLiterature] = useState<{ content: string; title: string } | null>(null);
    const [isFinishedVideo, setIsFinishedVideo] = useState<boolean>(false);

    const [scriptSegments, setScriptSegments] = useState<string[]>([]); // string array of headers
    const [scriptTitle, setScriptTitle] = useState<string>('');

    const [checkedImagesList, setCheckedImagesList] = useState<ImagesListComplete[]>([]);

    const [voices_list, setVoicesList] = useState<string[]>([]) // string array of voice

    const handleNext = () => {
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const handleReset = () => {
        setActiveStep(0);
    };

    const handleFinish = () => {
        setIsFinishedVideo(true);
    };

    const handleLiteratureSelected = (content: string, title: string) => {
        setSelectedLiterature({ content, title });
        handleNext(); // Move to the next step (ScriptAutoGenerate)
    };

    const handleScriptComplete = (segments: string[], title: string) => {
        setScriptSegments(segments);
        console.log("check scripts: ", scriptSegments);
        setScriptTitle(title);
        handleNext(); // Move to the next step (GenerateVoice)
    };

    const handleVoiceComplete = (voices: string[], scripts: string[]) => {
        setVoicesList(voices);
        setScriptSegments(scripts);
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
        <>
            <div className={clsx(styles.container, 'mb-4')}>
                <FloatingParticles />
                <div className={clsx(styles.left)}>
                    <div className={clsx(styles.otherThing)}>
                        <WaitingEntertainment />
                    </div>
                    <div className={clsx(styles.stepBar)}>
                        <StepBar
                            steps={steps}
                            activeStep={activeStep}
                            handleNext={handleNext}
                            handleBack={handleBack}
                            handleReset={handleReset}
                            scriptSegments={scriptSegments}
                            checkedImagesList={checkedImagesList}
                            voices_list={voices_list}
                            onFinish={handleFinish}
                        />
                    </div>
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
                            <div className="create-video-image-container">
                                <ImagePrompt
                                    promptId={promptId}
                                    scriptSegments={scriptSegments}
                                    handleCheckedImagesListComplete={handleCheckedImagesListComplete}
                                />
                            </div>
                        )}
                        {activeStep === 3 && (
                            <div className="create-video-voice-container">
                                <GenerateVoice
                                    scriptSegments={scriptSegments}
                                    scriptTitle={scriptTitle}
                                    onComplete={handleVoiceComplete}
                                />
                            </div>
                        )}
                    </PromptBody>
                </div>
            </div>
            <ImportantAlert isFinishedVideo={isFinishedVideo} promptId={promptId} />
        </>
    );
}

export default CreateVideo;
