import mongoose, { Document } from 'mongoose';

export interface IImageConfig extends Document {
    style: string;
    size: string;
    resolution: string;
    color_scheme: string;
    generated_images: string[];
}

export interface ILiteratureWork extends Document {
    title: string;
    author: string;
    genre: string;
    summary: string;
    content: string[];
}

export interface IUser extends Document {
    username: string;
    email: string;
    password_hash: string;
    role: string;
}

export interface IVideo extends Document {
    user_id?: mongoose.Types.ObjectId;
    literature_work_id: mongoose.Types.ObjectId;
    script: string;
    voice_config: mongoose.Types.ObjectId;
    image_config: mongoose.Types.ObjectId;
    is_finished: boolean;
    publish_date: Date;
}

export interface IVideoPublishHistory extends Document {
    video_id: mongoose.Types.ObjectId;
    platform: string;
    publish_date: Date;
    status: string;
    video_url: string;
}

export interface IVoiceConfig extends Document {
    voice_service: string;
    language: string;
    style: string;
    speed: number;
    pitch: number;
    volume: number;
    audio_content: string[];
}
