import express, { Express, Request, response, Response } from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cors from 'cors';
import VideoRouter from './routers/VideoRouter';
import ImageRouter from './routers/ImageRouter';
import cookieParser from 'cookie-parser';
import InformationRouter from './routers/InformationRouter';
import UserRouter from './routers/UserRouter';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;
const databaseURL = process.env.DB_URL as string;

app.use(cors(
    {
        origin: "http://localhost:5173",
        credentials: true, 
    }
));

app.use(cookieParser());

app.use(express.json({ limit: '10mb' }));

app.get('/', (req: Request, res: Response) => {
    res.send('Express + TypeScript Server');
});

app.use('/video', VideoRouter);
app.use('/image', ImageRouter);
app.use('/information', InformationRouter);
app.use('/user', UserRouter);

mongoose
    .connect(databaseURL)
    .then(() => {
        console.log('[database]: Connected to the database');

        app.listen(port, () => {
            console.log(`[server]: Server is running at http://localhost:${port}`);
        });
    })
    .catch((error) => {
        console.log('[database]: Database connection failed', error);
    });
