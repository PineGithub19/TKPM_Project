import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

import * as DBServices from '../services/DBServices';
import ImageConfigModel from '../models/ImageConfig';

dotenv.config();

const stableDiffusionUrl = process.env.LOCAL_STABLE_DIFFUSION_URL_TEXT_TO_IMAGE as string;
const apiKeyImageToText = process.env.GEMINI_API_KEY as string;
const googleAI = new GoogleGenerativeAI(apiKeyImageToText);
const geminiModelImageToText = googleAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
});

interface IImageConfig {
    style: string;
    size: string;
    resolution: string;
    color_scheme: string;
    generated_images: string[];
}

class ImageController {
    private DEFAULT_IMAGE_HEIGHT: number;
    private DEFAULT_IMAGE_WIDTH: number;

    constructor() {
        this.DEFAULT_IMAGE_HEIGHT = 256;
        this.DEFAULT_IMAGE_WIDTH = 256;

        this.handleTextToImage = this.handleTextToImage.bind(this);
        this.handleTextToMultipleImages = this.handleTextToMultipleImages.bind(this);
        this.handleImageToText = this.handleImageToText.bind(this);
    }

    async handleTextToImage(req: Request, res: Response, next: NextFunction) {
        try {
            const { prompt } = req.body;

            if (!prompt) {
                res.status(400).json({ message: 'Prompt is required' });
            }

            const payload: {
                prompt: string;
                steps: number;
                width: number;
                height: number;
                cfg_scale: number;
                seed: number;
                sampler_name: string;
            } = {
                prompt,
                steps: 10,
                width: this.DEFAULT_IMAGE_WIDTH,
                height: this.DEFAULT_IMAGE_HEIGHT,
                cfg_scale: 7,
                seed: -1,
                sampler_name: 'Euler a',
            };

            const response = await axios.post(stableDiffusionUrl, payload, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.status === 200) {
                const base64Image = response.data.images[0]; // Get base64 string
                // const imageBuffer = Buffer.from(base64Image, 'base64'); // Decode base64
                // fs.writeFileSync('./lighthouse.jpeg', imageBuffer); // Save as an image file
                // const imageData: IImageConfig = {
                //     style: 'classic',
                //     size: 'small',
                //     resolution: `${this.DEFAULT_IMAGE_WIDTH}x${this.DEFAULT_IMAGE_HEIGHT}`,
                //     color_scheme: 'normal',
                //     generated_images: [base64Image],
                // };

                // await DBServices.createDocument(ImageConfigModel, imageData);
                res.status(200).json({ image: base64Image });
            } else {
                res.status(response.status).send('Failed to generate image');
            }
        } catch (error) {
            console.error(error);
            res.status(500).send('Error generating image');
        }
    }

    async handleTextToMultipleImages(req: Request, res: Response, next: NextFunction) {
        try {
            const { prompt } = req.body;

            if (!prompt) {
                res.status(400).json({ message: 'Prompt is required' });
            }

            const payload: {
                prompt: string;
                steps: number;
                width: number;
                height: number;
                cfg_scale: number;
                seed: number;
                sampler_name: string;
                batch_size: number;
            } = {
                prompt,
                steps: 10,
                width: this.DEFAULT_IMAGE_WIDTH,
                height: this.DEFAULT_IMAGE_HEIGHT,
                cfg_scale: 7,
                seed: -1,
                sampler_name: 'Euler a',
                batch_size: 2,
            };

            const response = await axios.post(stableDiffusionUrl, payload, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.status === 200) {
                const images = response.data.images as Base64URLString[];
                // images.forEach((base64Image: string, index: number) => {
                //     const imageBuffer = Buffer.from(base64Image, 'base64');
                //     fs.writeFileSync(`./lighthouse-${index}.jpeg`, imageBuffer);
                // });
                const imageData: IImageConfig = {
                    style: 'classic',
                    size: 'small',
                    resolution: `${this.DEFAULT_IMAGE_WIDTH}x${this.DEFAULT_IMAGE_HEIGHT}`,
                    color_scheme: 'normal',
                    generated_images: images,
                };

                const imageDataResult = await DBServices.createDocument(ImageConfigModel, imageData);
                res.status(200).json({ imageList: imageDataResult.generated_images });
            } else {
                res.status(response.status).send('Failed to generate images');
            }
        } catch (error) {
            console.error(error);
            res.status(500).send('Error generating images');
        }
    }

    async handleImageToText(req: Request, res: Response, next: NextFunction) {
        const { prompt, image } = req.body;

        if (!prompt || !image) {
            res.status(400).json({ message: 'Prompt and image are required' });
        }
        // image needs to be base64 type.
        const data = (await DBServices.getDocumentById(ImageConfigModel, '67d8fbc0c87d0a480f23ac68')) as IImageConfig;
        const image1 = data.generated_images[0];

        // const base64Image = image.replace(/^data:image\/\w+;base64,/, '');

        const request = {
            contents: [
                {
                    role: 'user',
                    parts: [{ text: prompt }, { inlineData: { data: image1, mimeType: 'image/jpeg' } }],
                },
            ],
        };

        try {
            const result = await geminiModelImageToText.generateContent(request);
            console.log(result.response.text());
            res.status(200).send(result.response.text());
        } catch (error) {
            console.error('Error generating text:', error);
            res.status(500).send('Error generating text');
        }
    }
}

export default ImageController;
