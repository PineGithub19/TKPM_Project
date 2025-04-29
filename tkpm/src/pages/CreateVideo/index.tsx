import clsx from 'clsx';
import { useEffect, useState, useRef, useCallback } from 'react';
import { BlockerFunction, useBlocker, Blocker, useNavigate } from 'react-router-dom';
import SweetAlert from '../../components/SweetAlert';
import styles from './CreateVideo.module.css';
import StepBar from './CreateVideoComponents/StepBar/StepBar';
import FloatingParticles from './CreateVideoComponents/FloatingParticles/FloatingParticles';
import WaitingEntertainment from './CreateVideoComponents/WaitingEntertainment/WaitingEntertainment';
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
        label: 'Create Images',
        description: 'Generate images for your video based on the script segments.',
    },
    {
        label: 'Create Voice Narration',
        description: 'Generate voice narrations for each segment of your script.',
    },
];

function ImportantAlert({
    isFinishedVideo,
    promptId,
    scriptPromptId,
    voicePromptId,
    imagePromptId,
}: {
    isFinishedVideo: boolean;
    promptId?: string;
    scriptPromptId?: string;
    voicePromptId?: string;
    imagePromptId?: string;
}) {
    const [isAlerted, setIsAlerted] = useState<boolean>(false);

    const handleConfirmAlert = async (blocker: Blocker) => {
        if (blocker.state === 'blocked') {
            try {
                await request.del('/information/delete', {
                    promptId: promptId,
                    scriptId: scriptPromptId,
                    voiceId: voicePromptId,
                    imageId: imagePromptId,
                });
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
            setIsAlerted(blocker.state === 'blocked');
        } else if (isFinishedVideo === true) {
            blocker.proceed?.();
            setIsAlerted(false);
        }
    }, [blocker, isFinishedVideo]);

    return isAlerted ? (
        <SweetAlert
            title="Wanna leave this page?"
            text="Your video has not been created yet. Do you want to keep the progress?."
            icon="question"
            confirmButtonText="Delete"
            denyButtonText="Keep it"
            onConfirm={() => handleConfirmAlert(blocker)}
            onDenied={() => {
                blocker.proceed?.();
                setIsAlerted(false);
            }}
        />
    ) : null;
}

function CreateVideo() {
    const [promptId, setPromptId] = useState<string>('');
    const [scriptPromptId, setScriptPromptId] = useState<string>('');
    const [voicePromptId, setVoicePromptId] = useState<string>('');
    const [imagePromptId, setImagePromptId] = useState<string>('');

    const [activeStep, setActiveStep] = useState(0);
    const hasFetchedPromptId = useRef(false);
    const [selectedLiterature, setSelectedLiterature] = useState<{ content: string; title: string } | null>(null);
    const [isFinishedVideo, setIsFinishedVideo] = useState<boolean>(false);

    const [scriptSegments, setScriptSegments] = useState<string[]>([]); // string array of headers
    const [scriptTitle, setScriptTitle] = useState<string>('');

    const [checkedImagesList, setCheckedImagesList] = useState<string[]>([]);

    const [voicesList, setVoicesList] = useState<string[]>([]); // string array of voice

    const navigate = useNavigate();

    const handleNext = () => {
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const handleReset = () => {
        setActiveStep(0);
    };

    const handleFinish = async () => {
        setIsFinishedVideo(true); // preemptively allow
        console.log('Finish video creation:', {
            scriptSegments,
            checkedImagesList,
            voicesList,
        });

        navigate('/edit-video', {
            state: {
                scriptSegments,
                checkedImagesList,
                voicesList,
            },
        });
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

    const handleVoiceComplete = (voices: string[], scripts: string[]) => {
        setVoicesList(voices);
        setScriptSegments(scripts);
        handleNext(); // Move to the image generation step
    };

    const handleCheckedImagesListComplete = (images: string[]) => {
        setCheckedImagesList(images);
    };

    useEffect(() => {
        if (!hasFetchedPromptId.current) {
            async function fetchPromptId() {
                const response = await request.post('/information/create');
                setPromptId(response?.promptId || '');
                setScriptPromptId(response?.scriptPromptId || '');
                setVoicePromptId(response?.voicePromptId || '');
                setImagePromptId(response?.imagePromptId || '');
            }
            fetchPromptId();
            hasFetchedPromptId.current = true;
        }
    }, []);

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
                                    promptId={scriptPromptId}
                                    literatureContent={selectedLiterature.content}
                                    literatureTitle={selectedLiterature.title}
                                    onComplete={handleScriptComplete}
                                />
                            </div>
                        )}
                        {activeStep === 2 && (
                            <div className="create-video-image-container">
                                <ImagePrompt
                                    promptId={imagePromptId}
                                    scriptSegments={scriptSegments}
                                    handleCheckedImagesListComplete={handleCheckedImagesListComplete}
                                />
                            </div>
                        )}
                        {activeStep === 3 && (
                            <div className="create-video-voice-container">
                                <GenerateVoice
                                    promptId={voicePromptId}
                                    scriptSegments={scriptSegments}
                                    scriptTitle={scriptTitle}
                                    onComplete={handleVoiceComplete}
                                />
                            </div>
                        )}
                    </PromptBody>
                </div>
            </div>
            <ImportantAlert
                isFinishedVideo={isFinishedVideo}
                promptId={promptId}
                scriptPromptId={scriptPromptId}
                voicePromptId={voicePromptId}
                imagePromptId={imagePromptId}
            />
        </>
    );
}

export default CreateVideo;
