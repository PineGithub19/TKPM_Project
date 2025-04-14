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

        this.handleTextToMultipleImages = this.handleTextToMultipleImages.bind(this);
        this.handleImageToText = this.handleImageToText.bind(this);
        this.getImages = this.getImages.bind(this);
        this.saveImageToLocal = this.saveImageToLocal.bind(this);
    }

    async getImages(req: Request, res: Response, next: NextFunction) {
        const { promptId } = req.query;

        if (!promptId) {
            res.status(400).json({ message: 'Prompt ID is required' });
        }

        try {
            const response = await DBServices.getDocumentById(ImageConfigModel, promptId as string);

            if (response) {
                res.status(200).json({ imageList: response.generated_images });
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
            const { prompt, configuration } = req.body;

            if (!prompt) {
                res.status(400).json({ message: 'Prompt is required' });
                return;
            }

            const payload = {
                prompt,
                // Standard
                steps: configuration?.steps || 10,
                width: configuration?.width || this.DEFAULT_IMAGE_WIDTH,
                height: configuration?.height || this.DEFAULT_IMAGE_HEIGHT,
                cfg_scale: configuration?.cfg_scale || 7,
                seed: configuration?.seed || -1,
                sampler_name: configuration?.sampler_name || 'Euler a',
                batch_size: configuration?.batch_size || 2,
                // Model
                override_settings: {
                    sd_model_checkpoint: configuration?.model || 'dreamshaper_8.safetensors',
                },
            };

            const response = await axios.post(stableDiffusionUrl, payload, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.status === 200) {
                const images = response.data.images as Base64URLString[];
                res.status(200).json({ imageList: images });
            } else {
                res.status(response.status).send('Failed to generate images');
            }
        } catch (error) {
            console.error(error);
            res.status(500).send('Error generating images');
        }
    }

    async handleTextToAnimation(req: Request, res: Response, next: NextFunction) {
        try {
            const { prompt, configuration } = req.body;

            if (!prompt) {
                res.status(400).json({ message: 'Prompt is required' });
                return;
            }

            const payload = {
                prompt,
                // Standard params
                steps: configuration?.steps || 20,
                cfg_scale: configuration?.cfg_scale || 7,
                width: configuration?.width || 512,
                height: configuration?.height || 512,
                override_settings: {
                    sd_model_checkpoint: configuration?.model || 'dreamshaper_8.safetensors',
                },
                // AnimatedDiff specific
                alwayson_scripts: {
                    AnimateDiff: {
                        args: [
                            {
                                model: 'mm_sd_v14.ckpt',
                                format: ['GIF'],
                                enable: true,
                                video_length: configuration?.video_length || 16,
                                fps: configuration?.fps || 8,
                                loop_number: configuration?.loop_number || 0,
                                closed_loop: 'R+P',
                                batch_size: 16,
                                stride: 1,
                                overlap: -1,
                                interp: 'Off',
                                interp_x: 10,
                                latent_power: configuration?.latent_power || 1,
                                latent_scale: 32,
                            },
                        ],
                    },
                },
            };

            // Different endpoint for AnimatedDiff
            const response = await axios.post(stableDiffusionUrl, payload, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.status === 200) {
                // AnimatedDiff returns a single GIF file
                const images = response.data.images as Base64URLString[];
                res.status(200).json({ imageList: images });
            } else {
                res.status(response.status).send('Failed to generate animation');
            }
        } catch (error) {
            console.error(error);
            res.status(500).send('Error generating animation');
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

    async saveImageToLocal(req: Request, res: Response, next: NextFunction) {
        const { generationType, images, promptId } = req.body;

        if (!images || !Array.isArray(images)) {
            res.status(400).json({ message: 'Images array is required' });
            return;
        }

        try {
            // Ensure the directory exists
            const publicDir = 'public';
            const imagesDir = 'public/images';

            if (!fs.existsSync(publicDir)) {
                fs.mkdirSync(publicDir);
            }
            if (!fs.existsSync(imagesDir)) {
                fs.mkdirSync(imagesDir);
            }

            const savedPaths: string[] = [];

            // Process each image
            images.forEach((base64Image: string, index: number) => {
                // Remove the data URL prefix if it exists
                const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');

                // Generate a unique filename using timestamp
                const timestamp = new Date().getTime();
                const filename =
                    generationType === 'static' ? `image_${timestamp}_${index}.png` : `image_${timestamp}_${index}.gif`;
                const filepath = `${imagesDir}/${filename}`;

                // Convert base64 to buffer and save
                const imageBuffer = Buffer.from(base64Data, 'base64');
                fs.writeFileSync(filepath, imageBuffer);

                savedPaths.push(`http://localhost:${process.env.PORT}/images/${filename}`);
            });

            // Update or create image config in database
            if (promptId) {
                const currentImageData = await DBServices.getDocumentById(ImageConfigModel, promptId);

                if (currentImageData) {
                    // Update existing document with $set to ensure the array is updated
                    const updateData = {
                        style: currentImageData.style,
                        size: currentImageData.size,
                        resolution: currentImageData.resolution,
                        color_scheme: currentImageData.color_scheme,
                        generated_images: savedPaths,
                    };

                    await DBServices.updateDocument(ImageConfigModel, promptId, updateData);
                } else {
                    // Create new document
                    const newDocument = {
                        style: 'classic',
                        size: 'small',
                        resolution: `${this.DEFAULT_IMAGE_WIDTH}x${this.DEFAULT_IMAGE_HEIGHT}`,
                        color_scheme: 'normal',
                        generated_images: savedPaths,
                    };
                    const response = await DBServices.createDocument(ImageConfigModel, newDocument);
                    console.log('Created document:', response);
                }
            }

            res.status(200).json({
                message: 'Images saved successfully',
                paths: savedPaths,
            });
        } catch (error) {
            console.error('Error saving images:', error);
            res.status(500).json({
                message: 'Error saving images',
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
}

export default ImageController;
