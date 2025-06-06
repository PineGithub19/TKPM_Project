import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { informationService } from '../services/InformationService/InformationService';

class InformationController {
    constructor() {
        this.createNewPrompt = this.createNewPrompt.bind(this);
        this.updatePrompt = this.updatePrompt.bind(this);
        this.deletePrompt = this.deletePrompt.bind(this);
    }

    async createNewPrompt(req: Request, res: Response, next: NextFunction) {
        try {
            const response = await informationService.createNewPrompt();
            res.status(200).json(response);
        } catch (error) {
            console.error('Error creating prompt:', error);
            if (error instanceof mongoose.Error.ValidationError) {
                res.status(400).json({
                    message: 'Validation error',
                    errors: error.errors,
                });
            } else {
                res.status(500).json({
                    message: 'Cannot create a Prompt',
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }
    }

    async updatePrompt(req: Request, res: Response, next: NextFunction) {
        const { promptId } = req.body;

        if (!promptId) {
            res.status(400).json({ message: 'Prompt ID is required' });
        }

        try {
            await informationService.updatePrompt(promptId as string);
            res.status(200).json({ message: 'Prompt updated' });
        } catch (error) {
            console.error(error);
            if (error instanceof Error && error.message === 'Prompt not found') {
                res.status(404).json({ message: 'Prompt not found' });
            } else {
                res.status(500).json({
                    message: 'Error updating prompt',
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }
    }

    async deletePrompt(req: Request, res: Response, next: NextFunction) {
        const { promptId, scriptId, voiceId, imageId } = req.query;

        if (!promptId) {
            res.status(400).json({ message: 'Prompt ID is required' });
        }

        try {
            await informationService.deletePrompt(
                promptId as string,
                scriptId as string,
                voiceId as string,
                imageId as string,
            );
            res.status(200).json({ message: 'Prompt deleted' });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: 'Error deleting prompt',
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
}

export default InformationController;
