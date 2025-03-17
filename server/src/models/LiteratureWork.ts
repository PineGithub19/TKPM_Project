import mongoose, { Schema, Document } from 'mongoose';

interface ILiteratureWork extends Document {
    title: string;
    author: string;
    genre: string;
    summary: string;
    content: string;
}

const LiteratureWorkSchema = new Schema<ILiteratureWork>(
    {
        title: { type: String, required: true },
        author: { type: String, required: true },
        genre: { type: String, required: true },
        summary: { type: String, required: true },
        content: { type: String, required: true },
    },
    {
        timestamps: true,
    },
);

export default mongoose.model<ILiteratureWork>('LiteratureWork', LiteratureWorkSchema);
