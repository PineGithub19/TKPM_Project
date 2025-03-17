import mongoose, { Schema, Document } from 'mongoose';

interface IImageConfig extends Document {
    style: string;
    size: string;
    resolution: string;
    color_scheme: string;
    generated_images: string[];
}

const ImageConfigSchema = new Schema<IImageConfig>(
    {
        style: { type: String, required: true },
        size: { type: String, required: true },
        resolution: { type: String, required: true },
        color_scheme: { type: String, required: true },
        generated_images: { type: [String], required: true },
    },
    {
        timestamps: true,
    },
);

export default mongoose.model<IImageConfig>('ImageConfig', ImageConfigSchema);
