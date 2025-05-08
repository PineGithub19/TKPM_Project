import mongoose, { Types } from 'mongoose';
import * as DBServices from '../DBServices';
import ImageConfigModel from '../../models/ImageConfig';
import VideoConfigModel from '../../models/Video';
import VoiceConfigModel from '../../models/VoiceConfig';
import ScriptModel from '../../models/LiteratureWork';

export interface VideoConfigData {
    _id?: string;
    user_id?: Types.ObjectId;
    literature_work_id: Types.ObjectId;
    script: string;
    voice_config: Types.ObjectId;
    image_config: Types.ObjectId;
    is_finished: boolean;
    publish_date: Date;
}

export interface LiteratureWorkData {
    _id?: string;
    title: string;
    full_content: string;
    author: string;
    genre: string;
    summary: string;
    content: string[];
}

export interface ImageConfigData {
    _id?: string;
    style: string;
    size: string;
    resolution: string;
    color_scheme: string;
    generated_images: string[];
}

export interface VoiceConfigData {
    _id?: string;
    voice_service: string;
    language: string;
    style: string;
    speed: number;
    pitch: number;
    volume: number;
    audio_content: string[];
}

export interface PromptResponse {
    promptId: string;
    scriptPromptId: string;
    voicePromptId: string;
    imagePromptId: string;
}

class InformationService {
    private DEFAULT_IMAGE_HEIGHT: number;
    private DEFAULT_IMAGE_WIDTH: number;

    constructor() {
        this.DEFAULT_IMAGE_HEIGHT = 256;
        this.DEFAULT_IMAGE_WIDTH = 256;
    }

    async createNewImagePrompt(): Promise<PromptResponse> {
        const scriptData: LiteratureWorkData = {
            title: 'title',
            full_content: 'default',
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

        console.log("Check videoResponse in BE: ", videoResponse);

        if (!videoResponse || !scriptResponse || !voiceResponse || !imageResponse) {
            throw new Error('Error creating prompt');
        }

        return {
            promptId: videoResponse._id as string,
            scriptPromptId: scriptResponse._id as string,
            voicePromptId: voiceResponse._id as string,
            imagePromptId: imageResponse._id as string,
        };
    }

    async updateImagePrompt(promptId: string): Promise<boolean> {
        const data = await DBServices.getDocumentById(VideoConfigModel, promptId);

        if (!data) {
            throw new Error('Prompt not found');
        }

        data.is_finished = true;
        const response = await DBServices.updateDocument(VideoConfigModel, promptId, data);

        if (!response) {
            throw new Error('Error: prompt is null');
        }

        return true;
    }

    async deleteImagePrompt(promptId: string, scriptId: string, voiceId: string, imageId: string): Promise<boolean> {
        const response = await Promise.all([
            DBServices.deleteDocument(VideoConfigModel, promptId),
            DBServices.deleteDocument(ScriptModel, scriptId),
            DBServices.deleteDocument(VoiceConfigModel, voiceId),
            DBServices.deleteDocument(ImageConfigModel, imageId),
        ]);

        if (!response) {
            throw new Error('Error: prompt is null');
        }

        return true;
    }
}

export default InformationService; 