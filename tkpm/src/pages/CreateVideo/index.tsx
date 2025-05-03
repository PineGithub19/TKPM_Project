import clsx from 'clsx';
import { useEffect, useState, useRef, useCallback } from 'react';
import { BlockerFunction, useBlocker, Blocker, useNavigate, useLocation } from 'react-router-dom';
import SweetAlert from '../../components/SweetAlert';
import styles from './CreateVideo.module.css';
import StepBar from './CreateVideoComponents/StepBar/StepBar';
import Moon from './CreateVideoComponents/Moon/Moon';
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
        label: 'Chọn tác phẩm văn học',
        description: `Tìm và chọn một tác phẩm văn học để làm cơ sở cho video của bạn.`,
    },
    {
        label: 'Tạo kịch bản',
        description: 'Cấu hình và tạo kịch bản dựa trên tác phẩm văn học đã chọn.',
    },
    {
        label: 'Tạo ảnh',
        description: 'Tạo hình ảnh cho video của bạn dựa trên các phân đoạn kịch bản.',
    },
    {
        label: 'Tạo tường thuật bằng giọng nói',
        description: 'Tạo lời tường thuật bằng giọng nói cho từng phân đoạn trong kịch bản của bạn.',
    },
];

const backgrounds = [
    'linear-gradient(to top right, #2a2a72, #009ffd)',
    'linear-gradient(to top right, #4b6cb7, #182848)',
    'linear-gradient(to top right, #0d1b2a, #1b263b)',
    'linear-gradient(to top right, #232526, #414345)',
];

// interface ImagesListComplete {
//     images: string[];
//     localImages: string[];
//     segment: string;
// }

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

interface LocationState {
    scriptSegments?: string[];
    checkedImagesList?: string[];
    voicesList?: string[];
    hasFetchedPromptId?: boolean;
    selectedLiterature?: { content: string; title: string };

    //cho các id của phiên làm việc:
    promptId?: string;
    scriptPromptId?: string;
    voicePromptId?: string;
    imagePromptId?: string;
}

function CreateVideo() {
    const location = useLocation();
    const state = location.state as LocationState;

    const [promptId, setPromptId] = useState<string>(state?.promptId || '');
    const [scriptPromptId, setScriptPromptId] = useState<string>(state?.scriptPromptId || '');
    const [voicePromptId, setVoicePromptId] = useState<string>(state?.voicePromptId || '');
    const [imagePromptId, setImagePromptId] = useState<string>(state?.imagePromptId || '');

    const [activeStep, setActiveStep] = useState(0);
    const hasFetchedPromptId = useRef<boolean>(state?.hasFetchedPromptId || false); // Fixed initialization
    const [selectedLiterature, setSelectedLiterature] = useState<{ content: string; title: string } | null>(
        state?.selectedLiterature || null,
    );
    const [isFinishedVideo, setIsFinishedVideo] = useState<boolean>(false);

    const [scriptSegments, setScriptSegments] = useState<string[]>(state?.scriptSegments || []); // string array of headers
    const [scriptTitle, setScriptTitle] = useState<string>('');
    const [imagepromptSegments, setImagePromptSegments] = useState<string[]>([]); // string array of headers

    const [checkedImagesList, setCheckedImagesList] = useState<string[]>(state?.checkedImagesList || []);

    const [voicesList, setVoicesList] = useState<string[]>(state?.voicesList || []); // string array of voice

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
        console.log('Received in CreateVideo before navigate:', {
            scriptSegments,
            checkedImagesList,
            voicesList,
        });

        navigate('/edit-video', {
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
    const handleLiteratureSelected = (content: string, title: string) => {
        setSelectedLiterature({ content, title });
        handleNext(); // Move to the next step (ScriptAutoGenerate)
    };

    const handleScriptComplete = (segments: string[], title: string = '', imagepromptSegments: string[]) => {
        setScriptSegments(segments);
        setScriptTitle(title);
        setImagePromptSegments(imagepromptSegments);
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
        console.log('CHECK hasFetchedPromptId in createVideo: ', hasFetchedPromptId.current);

        if (!hasFetchedPromptId.current) {
            async function fetchPromptId() {
                try {
                    const response = await request.post('/information/create');
                    console.log('API Response:', response); // Log the full response

                    if (response) {
                        setPromptId(response.promptId || '');
                        setScriptPromptId(response.scriptPromptId || '');
                        setVoicePromptId(response.voicePromptId || '');
                        setImagePromptId(response.imagePromptId || '');

                        // Log after setting state (but remember state updates are asynchronous)
                        console.log('IDs set from response:', {
                            promptId: response.promptId,
                            scriptPromptId: response.scriptPromptId,
                            voicePromptId: response.voicePromptId,
                            imagePromptId: response.imagePromptId,
                        });
                    } else {
                        console.error('Empty response received from server');
                    }
                } catch (error) {
                    console.error('Error fetching prompt IDs:', error);
                    // Handle error appropriately (show message to user, etc.)
                }
            }
            fetchPromptId();
            hasFetchedPromptId.current = true;
        }

        console.log('CHECK id in CreateVideo: ', {
            promptId,
            scriptPromptId,
            voicePromptId,
            imagePromptId,
        });

        console.log('Editvideo -> CreateVideo', {
            scriptSegments,
            checkedImagesList,
            voicesList,
        });
    }, [promptId, scriptPromptId, voicePromptId, imagePromptId]);

    return (
        <>
            <div className={clsx(styles.container)} style={{ background: backgrounds[activeStep] }}>
                <Moon />
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
                                <Literature
                                    onSelectLiterature={handleLiteratureSelected}
                                    selectedLiterature={selectedLiterature}
                                />
                            </div>
                        )}
                        {activeStep === 1 && selectedLiterature && (
                            <div className="create-video-script-container">
                                <ScriptAutoGenerate
                                    promptId={scriptPromptId}
                                    literatureContent={selectedLiterature.content}
                                    literatureTitle={selectedLiterature.title}
                                    onComplete={handleScriptComplete}
                                    scriptSegment={scriptSegments}
                                    selectedLiterature={selectedLiterature}
                                />
                            </div>
                        )}
                        {activeStep === 2 && (
                            <div className="create-video-image-container">
                                <ImagePrompt
                                    promptId={imagePromptId}
                                    scriptSegments={imagepromptSegments.length > 0 ? imagepromptSegments : scriptSegments} // Kiểm tra và gán giá trị
                                    handleCheckedImagesListComplete={handleCheckedImagesListComplete}
                                    checkedImagesList={checkedImagesList}
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
                                    voicesList={voicesList}
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
