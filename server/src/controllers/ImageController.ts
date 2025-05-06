import { Request, Response, NextFunction } from 'express';
import { imageService } from '../services/ImageService/image.service';
import { translate } from '@vitalets/google-translate-api';

class ImageController {
    constructor() {
        this.handleTextToMultipleImages = this.handleTextToMultipleImages.bind(this);
        this.handleImageToText = this.handleImageToText.bind(this);
        this.getImages = this.getImages.bind(this);
        this.saveImageBatchToLocal = this.saveImageBatchToLocal.bind(this);
    }

    async getImages(req: Request, res: Response, next: NextFunction) {
        const { promptId } = req.query;

        try {
            const response = await imageService.getImagesByPromptId(promptId as string);

            if (response) {
                res.status(200).json({ imageList: response });
            } else {
                res.status(500).send('Error: images is null');
            }
        } catch (error) {
            console.error(error);
            res.status(500).send('Error getting images');
        }
    }

    async handleTextToMultipleImages(req: Request, res: Response, next: NextFunction) {
        try {
            let { prompt, configuration } = req.body;
            prompt = await translate(prompt);
            console.log('Translated prompt:', prompt); // Log the translated prompt
            const response = await imageService.getMultipleImages(prompt.text, configuration);

            res.status(200).json({ imageList: response });
        } catch (error) {
            console.error(error);
            res.status(500).send('Error generating images');
        }
    }

    async handleTextToMultipleImagesWithGemini(req: Request, res: Response, next: NextFunction) {
        try {
            const { prompt } = req.body;

            const response = await imageService.getMultipleImagesWithGemini(prompt);

            res.status(200).json({ imageList: response });
        } catch (error) {
            console.error(error);
            res.status(500).send('Error generating images with Gemini');
        }
    }

    async handleTextToAnimation(req: Request, res: Response, next: NextFunction) {
        try {
            let { prompt, configuration } = req.body;
            prompt = await translate(prompt);
            console.log('Translated prompt:', prompt); // Log the translated prompt
            const response = await imageService.generateAnimation(prompt.text, configuration);
            res.status(200).json({ imageList: response });
        } catch (error) {
            console.error(error);
            res.status(500).send('Error generating animation');
        }
    }

    async handleImageToText(req: Request, res: Response, next: NextFunction) {
        try {
            let { prompt, image } = req.body;
            prompt = await translate(prompt);
            console.log('Translated prompt:', prompt); // Log the translated prompt
            const generatedText = await imageService.generateTextFromImage(prompt, image);

            res.status(200).send(generatedText);
        } catch (error) {
            console.error('Error generating text:', error);
            res.status(500).send('Error generating text');
        }
    }

    async saveImageBatchToLocal(req: Request, res: Response, next: NextFunction) {
        const { generationType, images, promptId, batchIndex, totalBatches, uploadSessionId } = req.body;

        if (!images || !Array.isArray(images)) {
            res.status(400).json({ message: 'Images array is required' });
        }

        if (!uploadSessionId) {
            res.status(400).json({ message: 'Upload session ID is required' });
        }

        try {
            const host = req.protocol + '://' + req.get('host');

            const result = await imageService.saveImageBatch({
                generationType,
                images,
                promptId,
                batchIndex,
                totalBatches,
                uploadSessionId,
                port: process.env.PORT || '3000',
                host,
            });

            res.status(200).json({
                message: 'Images saved successfully',
                ...result,
            });
        } catch (error) {
            console.error('Error saving images batch:', error);
            res.status(500).json({
                message: 'Error saving images batch',
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }

    async translateText(text: string, targetLanguage: string = 'en') {
        try {
            const translated = await translate(text, { to: targetLanguage });
            return translated.text;
        } catch (error) {
            console.error('Error translating text:', error);
            throw new Error('Translation failed');
        }
    }
}

export default ImageController;
