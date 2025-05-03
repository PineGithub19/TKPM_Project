import mongoose, { Schema } from 'mongoose';
import { ILiteratureWork } from '../types/modelTypes';

const LiteratureWorkSchema = new Schema<ILiteratureWork>(
    {
        title: { type: String, required: true },
        full_content: {type: String , required: true},
        author: { type: String, required: true },
        genre: { type: String, required: true },
        summary: { type: String, required: true },
        content: { type: [String], required: true },
    },
    {
        timestamps: true,
    },
);

export default mongoose.model<ILiteratureWork>('LiteratureWork', LiteratureWorkSchema);
