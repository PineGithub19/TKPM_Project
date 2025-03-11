import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cors from 'cors';
import axios from 'axios';
import fs from 'fs';
import FromData from 'form-data';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;
const databaseURL = process.env.DB_URL as string;

app.use(cors());
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
    res.send('Express + TypeScript Server');
});

const apiKey = process.env.STABLE_DIFFUSION_API_KEY as string;
const baseUrl = process.env.STABLE_DIFFUSION_URL_TEXT_TO_IMAGE as string;

app.post('/generate-image', async (req: Request, res: Response) => {
    try {
        const { prompt, output_format } = req.body;
        const payload: {
            prompt: string;
            output_format: string;
        } = { prompt, output_format };

        if (!prompt || !output_format) {
            res.status(400).json({ message: 'Prompt and output_format are required' });
        }

        // console.log('Payload:', payload);

        const response = await axios.post(baseUrl, axios.toFormData(payload, new FromData()), {
            validateStatus: undefined,
            responseType: 'arraybuffer',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                Accept: 'image/*',
            },
        });

        if (response.status === 200) {
            fs.writeFileSync('./lighthouse.jpeg', Buffer.from(response.data));
            res.status(200).send('OK');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error generating image');
    }
});

mongoose
    .connect(databaseURL)
    .then(() => {
        console.log('[database]: Connected to the database');

        app.listen(port, () => {
            console.log(`[server]: Server is running at http://localhost:${port}`);
        });
    })
    .catch((error) => {
        console.log('[database]: Database connection failed', error);
    });
