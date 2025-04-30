import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import StepContent from '@mui/material/StepContent';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
// import StepConnector from '@mui/material/StepConnector';

interface ImagesListComplete {
    images: string[];
    localImages: string[];
    segment: string;
}

function StepBar({
    steps,
    activeStep,
    handleNext,
    handleBack,
    handleReset,
    onFinish,
}: {
    steps: { label: string; description: string }[];
    activeStep: number;
    handleNext: () => void;
    handleBack: () => void;
    handleReset: () => void;
    scriptSegments?: string[];
    checkedImagesList?: ImagesListComplete[];
    voices_list?: string[];
    onFinish?: () => Promise<void>;
}) {
    const handleFinish = async () => {
        if (onFinish) {
            await onFinish();
        }
    };

    return (
        <Box
            sx={{
                bgcolor: '#2C3E50',
                borderRadius: 3,
                p: 4,
                boxShadow: ' 0 4px 20px rgba(0, 0, 0, 0.2)',
                color: '#f5f5f5',
                transition: 'box-shadow 0.3s ease, border 0.3s ease',
                boxSizing: 'border-box',
                border: '2px solid transparent',
                '&:hover': {
                    boxShadow: 8,
                    border: '2px solid #ffffff',
                },
            }}
        >
            <Stepper
                activeStep={activeStep}
                orientation="vertical"
                sx={{
                    '.MuiStepIcon-root': {
                        color: '#B3B6B7',
                        fontSize: '2.5rem',
                        '&.Mui-active': {
                            color: '#E74C3C',
                        },
                        '&.Mui-completed': {
                            color: '#1ABC9C',
                        },
                    },
                    '.MuiStepContent-root': {
                        marginLeft: '20px',
                    },
                    '.MuiStepConnector-line': {
                        marginLeft: '8px',
                    },
                }}
            >
                {steps.map((step, index) => (
                    <Step key={step.label}>
                        <StepLabel
                            sx={{
                                '.MuiStepLabel-label': {
                                    fontWeight: index === activeStep ? 'bold' : 500,
                                    color: index === activeStep ? '#E74E3C !important' : '#BDC3C7 !important',
                                    fontSize: '1.5rem',
                                },
                                '.MuiSvgIcon-root': {
                                    color: index <= activeStep ? '#E74E3C' : '#B3B6B7',
                                },
                            }}
                        >
                            {step.label}
                        </StepLabel>
                        <StepContent>
                            <Typography sx={{ color: '#BDC3C7', fontSize: '1.2rem', mb: 2 }}>
                                {step.description}
                            </Typography>
                            <Box sx={{ mb: 3 }}>
                                <Button
                                    variant="contained"
                                    onClick={index === steps.length - 1 ? handleFinish : handleNext}
                                    sx={{
                                        mt: 1,
                                        mr: 1,
                                        bgcolor: '#E74C3C',
                                        color: '#fff',
                                        fontSize: '1.2rem',
                                        padding: '15px 30px',
                                        '&:hover': { bgcolor: '#C0392B' },
                                        textTransform: 'none',
                                    }}
                                >
                                    {index === steps.length - 1 ? 'Finish' : 'Continue'}
                                </Button>
                                <Button
                                    disabled={index === 0}
                                    onClick={handleBack}
                                    sx={{
                                        mt: 1,
                                        mr: 1,
                                        color: 'white',
                                        backgroundColor: '#5D6D7E',
                                        borderColor: '#5D6D7E',
                                        fontSize: '1.2rem',
                                        padding: '15px 30px',
                                        textTransform: 'none',
                                        display: activeStep === 0 ? 'none' : 'inline-block',
                                        '&:hover': {
                                            backgroundColor: '#4D5B63',
                                            borderColor: '#4D5B63',
                                        },
                                    }}
                                >
                                    Back
                                </Button>
                            </Box>
                        </StepContent>
                    </Step>
                ))}
            </Stepper>
            {activeStep === steps.length && (
                <Paper
                    square
                    elevation={0}
                    sx={{
                        p: 3,
                        mt: 2,
                        bgcolor: '#34495E',
                        borderRadius: 2,
                        color: '#BDC3C7',
                    }}
                >
                    <Typography sx={{ mb: 1, fontSize: '1.5rem' }}>
                        🎉 All steps completed - you're finished!
                    </Typography>
                    <Button
                        onClick={handleFinish}
                        sx={{
                            textTransform: 'none',
                            backgroundColor: '#E74C3C',
                            color: '#fff',
                            fontSize: '1.2rem',
                            padding: '15px 30px',
                            marginRight: '15px',
                            '&:hover': { backgroundColor: '#C0392B' },
                        }}
                    >
                        Proceed to Edit Video
                    </Button>
                    <Button
                        onClick={handleReset}
                        sx={{
                            textTransform: 'none',
                            color: '#1ABC9C',
                            fontSize: '1.2rem',
                            padding: '15px 30px',
                            '&:hover': { color: '#16A085' },
                        }}
                    >
                        Reset
                    </Button>
                </Paper>
            )}
        </Box>
    );
}

export default StepBar;
