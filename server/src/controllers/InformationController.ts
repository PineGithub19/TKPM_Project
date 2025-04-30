import mongoose, { Types } from 'mongoose';
import { Request, Response, NextFunction } from 'express';
import * as DBServices from '../services/DBServices';
import ImageConfigModel from '../models/ImageConfig';
import VideoConfigModel from '../models/Video';
import VoiceConfigModel from '../models/VoiceConfig';
import ScriptModel from '../models/LiteratureWork';

interface VideoConfigData {
    _id?: string;
    user_id?: Types.ObjectId;
    literature_work_id: Types.ObjectId;
    script: string;
    voice_config: Types.ObjectId;
    image_config: Types.ObjectId;
    is_finished: boolean;
    publish_date: Date;
}

interface LiteratureWorkData {
    _id?: string;
    title: string;
    author: string;
    genre: string;
    summary: string;
    content: string[];
}

interface ImageConfigData {
    _id?: string;
    style: string;
    size: string;
    resolution: string;
    color_scheme: string;
    generated_images: string[];
}

interface VoiceConfigData {
    _id?: string;
    voice_service: string;
    language: string;
    style: string;
    speed: number;
    pitch: number;
    volume: number;
    audio_content: string[];
}

class InformationController {
    private DEFAULT_IMAGE_HEIGHT;
    private DEFAULT_IMAGE_WIDTH;

    constructor() {
        this.DEFAULT_IMAGE_HEIGHT = 256;
        this.DEFAULT_IMAGE_WIDTH = 256;

        this.createNewImagePrompt = this.createNewImagePrompt.bind(this);
    }

    async createNewImagePrompt(req: Request, res: Response, next: NextFunction) {
        try {
            const scriptData: LiteratureWorkData = {
                title: 'title',
                author: 'author',
                genre: 'gerne',
                summary: 'summary',
                content: [],
            };
            const scriptResponse = (await DBServices.createDocument(ScriptModel, scriptData)) as LiteratureWorkData;

            const VoiceConfigData: VoiceConfigData = {
                voice_service: 'Google TTS',
                language: 'VN',
                style: 'style',
                speed: 1,
                pitch: 1,
                volume: 1,
                audio_content: [],
            };
            const voiceResponse = (await DBServices.createDocument(
                VoiceConfigModel,
                VoiceConfigData,
            )) as VoiceConfigData;

            const imageData: ImageConfigData = {
                style: 'classic',
                size: 'small',
                resolution: `${this.DEFAULT_IMAGE_WIDTH}x${this.DEFAULT_IMAGE_HEIGHT}`,
                color_scheme: 'normal',
                generated_images: [],
            };
            const imageResponse = (await DBServices.createDocument(ImageConfigModel, imageData)) as ImageConfigData;

            const videoData: VideoConfigData = {
                literature_work_id: new mongoose.Types.ObjectId(scriptResponse._id),
                script: 'script',
                voice_config: new mongoose.Types.ObjectId(voiceResponse._id),
                image_config: new mongoose.Types.ObjectId(imageResponse._id),
                is_finished: false,
                publish_date: new Date(),
            };
            const videoResponse = (await DBServices.createDocument(VideoConfigModel, videoData)) as VideoConfigData;

            if (!videoResponse || !scriptResponse || !voiceResponse || !imageResponse) {
                res.status(500).send('Error creating prompt');
            } else {
                res.status(200).json({
                    promptId: videoResponse._id,
                    scriptPromptId: scriptResponse._id,
                    voicePromptId: voiceResponse._id,
                    imagePromptId: imageResponse._id,
                });
            }
        } catch (error) {
            res.status(500).send('Cannot create a Prompt: ' + error);
        }
    }

    async updateImagePrompt(req: Request, res: Response, next: NextFunction) {
        const { promptId } = req.body;

        if (!promptId) {
            res.status(400).json({ message: 'Prompt ID is required' });
        }

        try {
            const data = await DBServices.getDocumentById(VideoConfigModel, promptId as string);

            if (!data) {
                res.status(404).json({ message: 'Prompt not found' });
                return;
            } else {
                data.is_finished = true;
            }

            const response = await DBServices.updateDocument(VideoConfigModel, promptId as string, data);

            if (response) {
                res.status(200).json({ message: 'Prompt updated' });
            } else {
                res.status(500).send('Error: prompt is null');
            }
        } catch (error) {
            console.error(error);
            res.status(500).send('Error updating prompt');
        }
    }

    async deleteImagePrompt(req: Request, res: Response, next: NextFunction) {
        const { promptId, scriptId, voiceId, imageId } = req.query;

        if (!promptId) {
            res.status(400).json({ message: 'Prompt ID is required' });
        }

        try {
            const response = await Promise.all([
                DBServices.deleteDocument(VideoConfigModel, promptId as string),
                DBServices.deleteDocument(ScriptModel, scriptId as string),
                DBServices.deleteDocument(VoiceConfigModel, voiceId as string),
                DBServices.deleteDocument(ImageConfigModel, imageId as string),
            ]);

            if (response) {
                res.status(200).json({ message: 'Prompt deleted' });
            } else {
                res.status(500).send('Error: prompt is null');
            }
        } catch (error) {
            console.error(error);
            res.status(500).send('Error deleting prompt');
        }
    }
}

export default InformationController;
