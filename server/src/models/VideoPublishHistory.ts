import mongoose, { Schema } from 'mongoose';
import { IVideoPublishHistory } from '../types/modelTypes';

const VideoPublishHistorySchema = new Schema<IVideoPublishHistory>(
    {
        video_id: { type: Schema.Types.ObjectId, ref: 'Video', required: true },
        platform: { type: String, required: true },
        publish_date: { type: Date, required: true },
        status: { type: String, required: true },
        video_url: { type: String, required: true },
    },
    {
        timestamps: true,
    },
);

export default mongoose.model<IVideoPublishHistory>('VideoPublishHistory', VideoPublishHistorySchema);
