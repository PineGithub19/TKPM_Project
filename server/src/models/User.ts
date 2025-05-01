import mongoose, { Schema } from 'mongoose';
import { IUser } from '../types/modelTypes';

const UserScheme: Schema = new Schema<IUser>(
    {
        username: { type: String, required: true },
        email: { type: String, required: true },
        password_hash: { type: String, required: false },
        role: { type: String, required: true },
    },
    {
        timestamps: true,
    },
);

export default mongoose.model<IUser>('User', UserScheme);
