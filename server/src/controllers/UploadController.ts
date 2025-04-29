import { Request, Response } from "express";
import { getYoutubeAuthUrl } from "../services/UploadService";
import { google } from "googleapis";
import { uploadVideoToYoutube } from "../services/UploadService";
import path from "path";

const oauth2Client = new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
    process.env.YOUTUBE_REDIRECT_URI
);

export const redirectToYoutubeAuth = (req: Request, res: Response) => {
    const url = getYoutubeAuthUrl();
    res.redirect(url);
};

export const handleYoutubeCallback = async (req: Request, res: Response) => {
    const code = req.query.code as string;

    try {
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // Tự động upload video khi xác thực xong
        const videoPath = path.join(__dirname, "../../public/videodemo.mp4"); // đảm bảo file này tồn tại
        const uploadResult = await uploadVideoToYoutube(oauth2Client, videoPath);

        console.log("Upload successful:", uploadResult);

        res.send("Video uploaded to YouTube successfully!");
    } catch (error) {
        console.error("Error during authentication or upload:", error);
        res.status(500).send("Error during authentication or upload.");
    }
};
