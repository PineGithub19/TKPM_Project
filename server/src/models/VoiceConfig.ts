import mongoose, { Schema, Document } from 'mongoose';
import { IVoiceConfig } from '../types/modelTypes';

const VoiceConfigSchema = new Schema<IVoiceConfig>(
    {
        voice_service: { type: String, required: true },
        language: { type: String, required: true },
        style: { type: String, required: true },
        speed: { type: Number, required: true },
        pitch: { type: Number, required: true },
        volume: { type: Number, required: true },
    },
    {
        timestamps: true,
    },
);

export default mongoose.model<IVoiceConfig>('VoiceConfig', VoiceConfigSchema);
