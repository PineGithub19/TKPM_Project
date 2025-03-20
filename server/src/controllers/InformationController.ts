import { Request, Response, NextFunction } from 'express';
import * as DBServices from '../services/DBServices';
import ImageConfigModel from '../models/ImageConfig';

interface IImageConfig {
    _id?: string;
    style: string;
    size: string;
    resolution: string;
    color_scheme: string;
    generated_images: string[];
}

class InformationController {
    private DEFAULT_IMAGE_HEIGHT;
    private DEFAULT_IMAGE_WIDTH;

    constructor() {
        this.DEFAULT_IMAGE_HEIGHT = 256;
        this.DEFAULT_IMAGE_WIDTH = 256;

        this.createNewImagePrompt = this.createNewImagePrompt.bind(this);
    }

    async createNewImagePrompt(req: Request, res: Response, next: NextFunction) {
        try {
            const data: IImageConfig = {
                style: 'classic',
                size: 'small',
                resolution: `${this.DEFAULT_IMAGE_WIDTH}x${this.DEFAULT_IMAGE_HEIGHT}`,
                color_scheme: 'normal',
                generated_images: [],
            };
            const response = (await DBServices.createDocument(ImageConfigModel, data)) as IImageConfig;

            if (response) {
                res.status(200).json({ id: response._id });
            }
        } catch (error) {
            res.status(500).send('Cannot create a Image Prompt');
        }
    }
}

export default InformationController;
