import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const baseUrl = process.env.LOCAL_STABLE_DIFFUSION_URL_TEXT_TO_IMAGE as string;
const apiKeyImageToText = process.env.GEMINI_API_KEY as string;
const googleAI = new GoogleGenerativeAI(apiKeyImageToText);
const geminiModelImageToText = googleAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
});

class ImageController {
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
                steps: 20,
                width: 256,
                height: 256,
                cfg_scale: 7,
                seed: -1,
                sampler_name: 'Euler a',
            };

            const response = await axios.post(baseUrl, payload, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.status === 200) {
                const base64Image = response.data.images[0]; // Get base64 string
                const imageBuffer = Buffer.from(base64Image, 'base64'); // Decode base64
                fs.writeFileSync('./lighthouse.jpeg', imageBuffer); // Save as an image file
                res.status(200).send('Image saved successfully');
            } else {
                res.status(response.status).send('Failed to generate image');
            }
        } catch (error) {
            console.error(error);
            res.status(500).send('Error generating image');
        }
    }

    async handleImageToText(req: Request, res: Response, next: NextFunction) {
        const { prompt, image } = req.body;

        if (!prompt || !image) {
            res.status(400).json({ message: 'Prompt and image are required' });
        }

        const base64Image = image.replace(/^data:image\/\w+;base64,/, '');

        const request = {
            contents: [
                {
                    role: 'user',
                    parts: [{ text: prompt }, { inlineData: { data: base64Image, mimeType: 'image/jpeg' } }],
                },
            ],
        };

        try {
            const res = await geminiModelImageToText.generateContent(request);
            console.log(res.response.text());
        } catch (error) {
            console.error('Error generating text:', error);
        }
    }
}

export default ImageController;
