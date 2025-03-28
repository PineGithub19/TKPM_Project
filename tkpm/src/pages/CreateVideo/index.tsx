import { useEffect, useState, useRef } from 'react';
import clsx from 'clsx';
import styles from './CreateVideo.module.css';
import StepBar from './CreateVideoComponents/StepBar/StepBar';
import PromptBody from './CreateVideoComponents/PromptBody/PromptBody';
import Literature from '../Literature';
import ImagePrompt from '../ImagePrompt';

import * as request from '../../utils/request';

const steps = [
    {
        label: 'Summarize Literature & Generate Script',
        description: `Enter a topic and let the AI summarize the literature and generate a script for your Video.`,
    },
    {
        label: 'Create Voice Configuration',
        description: 'Choose a voice configuration for your video. You can select the voice, language, and accent.',
    },
    {
        label: 'Create Images for Video',
        description: 'Generate images for your video. You can choose the style, resolution, and other parameters.',
    },
];

function CreateVideo() {
    const [promptId, setPromptId] = useState<string>('');
    const [activeStep, setActiveStep] = useState(0);
    const hasFetchedPromptId = useRef(false);

    const handleNext = () => {
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const handleReset = () => {
        setActiveStep(0);
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

    return (
        <div className={clsx(styles.background)}>
            <div className={clsx('container', 'd-flex', 'justify-space-between')}>
                <StepBar
                    steps={steps}
                    activeStep={activeStep}
                    handleNext={handleNext}
                    handleBack={handleBack}
                    handleReset={handleReset}
                />
                <PromptBody>
                    {activeStep === 0 && <Literature />}
                    {activeStep === 1 && <div>Voice Configuration</div>}
                    {activeStep === 2 && <ImagePrompt promptId={promptId} />}
                </PromptBody>
            </div>
        </div>
    );
}

export default CreateVideo;
