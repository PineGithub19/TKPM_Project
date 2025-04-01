import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import StepContent from '@mui/material/StepContent';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

function StepBar({
    steps,
    activeStep,
    handleNext,
    handleBack,
    handleReset,
}: {
    steps: { label: string; description: string }[];
    activeStep: number;
    handleNext: () => void;
    handleBack: () => void;
    handleReset: () => void;
}) {
    return (
        <Box sx={{ maxWidth: 300 }}>
            <Stepper activeStep={activeStep} orientation="vertical">
                {steps.map((step, index) => (
                    <Step key={step.label}>
                        <StepLabel
                            optional={
                                index === steps.length - 1 ? <Typography variant="caption">Last step</Typography> : null
                            }
                        >
                            {step.label}
                        </StepLabel>
                        <StepContent>
                            <Typography>{step.description}</Typography>
                            <Box sx={{ mb: 2 }}>
                                <Button variant="contained" onClick={handleNext} sx={{ mt: 1, mr: 1 }}>
                                    {index === steps.length - 1 ? 'Finish' : 'Continue'}
                                </Button>
                                <Button disabled={index === 0} onClick={handleBack} sx={{ mt: 1, mr: 1 }}>
                                    Back
                                </Button>
                            </Box>
                        </StepContent>
                    </Step>
                ))}
            </Stepper>
            {activeStep === steps.length && (
                <Paper square elevation={0} sx={{ p: 3 }}>
                    <Typography>All steps completed - you&apos;re finished</Typography>
                    <Button onClick={handleReset} sx={{ mt: 1, mr: 1 }}>
                        Reset
                    </Button>
                </Paper>
            )}
        </Box>
    );
}

export default StepBar;
