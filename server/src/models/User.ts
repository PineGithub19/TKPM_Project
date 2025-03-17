import mongoose, { Schema, Document } from 'mongoose';

interface IUser extends Document {
    username: string;
    email: string;
    password_hash: string;
    role: string;
}

const UserScheme: Schema = new Schema<IUser>(
    {
        username: { type: String, required: true },
        email: { type: String, required: true },
        password_hash: { type: String, required: true },
        role: { type: String, required: true },
    },
    {
        timestamps: true,
    },
);

export default mongoose.model<IUser>('User', UserScheme);
