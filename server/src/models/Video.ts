import mongoose, { Schema, Document } from 'mongoose';

interface IVideo extends Document {
    user_id: mongoose.Types.ObjectId;
    literature_work_id: mongoose.Types.ObjectId;
    script: string;
    voice_config: mongoose.Types.ObjectId;
    image_config: mongoose.Types.ObjectId;
    status: string;
    publish_date: Date;
}

const VideoSchema = new Schema<IVideo>(
    {
        user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        literature_work_id: { type: Schema.Types.ObjectId, ref: 'LiteratureWork', required: true },
        script: { type: String, required: true },
        voice_config: { type: Schema.Types.ObjectId, ref: 'VoiceConfig', required: true },
        image_config: { type: Schema.Types.ObjectId, ref: 'ImageConfig', required: true },
        status: { type: String, required: true },
        publish_date: { type: Date, required: true },
    },
    {
        timestamps: true,
    },
);

export default mongoose.model<IVideo>('Video', VideoSchema);
