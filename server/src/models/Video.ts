import mongoose, { Schema } from 'mongoose';
import { IVideo } from '../types/modelTypes';

const VideoSchema = new Schema<IVideo>(
    {
        user_id: { type: Schema.Types.ObjectId, ref: 'User', required: false },
        literature_work_id: { type: Schema.Types.ObjectId, ref: 'LiteratureWork', required: true },
        script: { type: String, required: true },
        voice_config: { type: Schema.Types.ObjectId, ref: 'VoiceConfig', required: true },
        image_config: { type: Schema.Types.ObjectId, ref: 'ImageConfig', required: true },
        is_finished: { type: Boolean, required: true },
        publish_date: { type: Date, required: true },
    },
    {
        timestamps: true,
    },
);

export default mongoose.model<IVideo>('Video', VideoSchema);
