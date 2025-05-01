import axios from 'axios';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleGenAI, Modality } from '@google/genai';

import * as DBServices from '../DBServices';
import ImageConfigModel from '../../models/ImageConfig';

dotenv.config();

const stableDiffusionUrl = process.env.LOCAL_STABLE_DIFFUSION_URL_TEXT_TO_IMAGE as string;
const geminiAPIKey = process.env.GEMINI_API_KEY as string;
const googleAI = new GoogleGenerativeAI(geminiAPIKey);
const imageGoogleAI = new GoogleGenAI({ apiKey: geminiAPIKey });

interface IImageConfig {
    style: string;
    size: string;
    resolution: string;
    color_scheme: string;
    generated_images: string[];
}

class ImageService {
    private DEFAULT_IMAGE_HEIGHT: number;
    private DEFAULT_IMAGE_WIDTH: number;
    private MAX_IMAGES_PER_BATCH: number;
    private imageSessionCache: Map<string, string[]>;

    constructor() {
        this.DEFAULT_IMAGE_HEIGHT = 256;
        this.DEFAULT_IMAGE_WIDTH = 256;
        this.MAX_IMAGES_PER_BATCH = 5; // Maximum number of images per batch
        this.imageSessionCache = new Map<string, string[]>();

        this.ensureFolderExists = this.ensureFolderExists.bind(this);
        this.getImagesByPromptId = this.getImagesByPromptId.bind(this);
        this.getMultipleImages = this.getMultipleImages.bind(this);
        this.generateAnimation = this.generateAnimation.bind(this);
        this.generateTextFromImage = this.generateTextFromImage.bind(this);
        this.saveImageBatch = this.saveImageBatch.bind(this);
    }

    private ensureFolderExists(folderPath: string) {
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath);
        }
    }

    async getImagesByPromptId(promptId: string) {
        if (!promptId) {
            throw new Error('Prompt ID is required');
        }

        const documents = await DBServices.getDocumentById(ImageConfigModel, promptId);

        if (!documents) {
            throw new Error('No images found for the given prompt ID');
        }

        return documents.generated_images;
    }

    async getMultipleImages(prompt: string, configuration?: any) {
        if (!prompt) {
            throw new Error('Prompt is required');
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

        if (response.status !== 200) {
            throw new Error(`Failed to generate images: ${response.statusText}`);
        }

        return response.data.images as Base64URLString[];
    }

    async getMultipleImagesWithGemini(prompt: string) {
        if (!prompt) {
            throw new Error('Prompt is required');
        }

        const basePrompt = "Create a rich, vivid, cinematic visual description for a story. Must NOT include any text. Based on the following:";
        const fullPrompt = `${basePrompt} ${prompt}`;


        const response = await imageGoogleAI.models.generateContent({
            model: 'gemini-2.0-flash-exp-image-generation',
            contents: [{ text: fullPrompt }],
            config: {
                responseModalities: [Modality.TEXT, Modality.IMAGE],
            },
        });

        if (
            response.candidates &&
            response.candidates[0] &&
            response.candidates[0].content &&
            Array.isArray(response.candidates[0].content.parts)
        ) {
            const images: string[] = [];
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.data && part.inlineData.mimeType) {
                    // Return as data URI string
                    images.push(part.inlineData.data);
                }
            }
            return images;
        } else {
            throw new Error('No valid candidates or parts in Gemini response');
        }
    }

    async generateAnimation(prompt: string, configuration?: any) {
        if (!prompt) {
            throw new Error('Prompt is required');
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

        if (response.status !== 200) {
            throw new Error(`Failed to generate animation: ${response.statusText}`);
        }

        return response.data.images as Base64URLString[];
    }

    async generateTextFromImage(prompt: string, imageBase64: string) {
        if (!prompt || !imageBase64) {
            throw new Error('Prompt and image are required');
        }

        // (Optional) If needed, remove `data:image/jpeg;base64,` prefix
        // const base64Image = imageBase64.replace(/^data:image\/\w+;base64,/, '');

        const data = (await DBServices.getDocumentById(ImageConfigModel, '67d8fbc0c87d0a480f23ac68')) as IImageConfig;
        const image1 = data.generated_images[0];

        const request = {
            contents: [
                {
                    role: 'user',
                    parts: [{ text: prompt }, { inlineData: { data: image1, mimeType: 'image/jpeg' } }],
                },
            ],
        };

        const geminiModelImageToText = googleAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
        });

        const result = await geminiModelImageToText.generateContent(request);
        return result.response.text();
    }

    async saveImageBatch(params: {
        generationType: 'static' | 'animated';
        images: string[];
        promptId?: string;
        batchIndex: number;
        totalBatches: number;
        uploadSessionId: string;
        port: string;
        host: string;
    }) {
        const { generationType, images, promptId, batchIndex, totalBatches, uploadSessionId, port, host } = params;

        const publicDir = 'public';
        const imagesDir = 'public/images';
        this.ensureFolderExists(publicDir);
        this.ensureFolderExists(imagesDir);

        const savedPaths: string[] = [];
        const timestamp = new Date().getTime();

        // Save each image
        images.forEach((base64Image: string, index: number) => {
            const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
            const uniqueIndex = batchIndex * this.MAX_IMAGES_PER_BATCH + index;
            const filename =
                generationType === 'static'
                    ? `image_${timestamp}_${uniqueIndex}.png`
                    : `image_${timestamp}_${uniqueIndex}.gif`;

            const filepath = `${imagesDir}/${filename}`;
            const imageBuffer = Buffer.from(base64Data, 'base64');
            fs.writeFileSync(filepath, imageBuffer);

            savedPaths.push(`${host}/images/${filename}`);
        });

        // Update cache
        const previousPaths = this.imageSessionCache.get(uploadSessionId) || [];
        this.imageSessionCache.set(uploadSessionId, [...previousPaths, ...savedPaths]);

        // Final batch: update database
        if (batchIndex === totalBatches - 1) {
            const allPaths = this.imageSessionCache.get(uploadSessionId) || [];

            if (promptId) {
                const currentImageData = await DBServices.getDocumentById(ImageConfigModel, promptId);

                if (currentImageData) {
                    const updateData = {
                        style: currentImageData.style,
                        size: currentImageData.size,
                        resolution: currentImageData.resolution,
                        color_scheme: currentImageData.color_scheme,
                        generated_images: allPaths,
                    };
                    await DBServices.updateDocument(ImageConfigModel, promptId, updateData);
                } else {
                    const newDocument = {
                        style: 'classic',
                        size: 'small',
                        resolution: `${this.DEFAULT_IMAGE_WIDTH}x${this.DEFAULT_IMAGE_HEIGHT}`,
                        color_scheme: 'normal',
                        generated_images: allPaths,
                    };
                    await DBServices.createDocument(ImageConfigModel, newDocument);
                }
            }

            this.imageSessionCache.delete(uploadSessionId);
        }

        return {
            paths: savedPaths,
            batchIndex,
            totalBatches,
            completed: batchIndex === totalBatches - 1,
        };
    }
}

export const imageService = new ImageService();
