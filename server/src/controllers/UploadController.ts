import { Request, Response } from "express";
import { getYoutubeAuthUrl } from "../services/UploadService";
import { google } from "googleapis";
import { uploadVideoToYoutube } from "../services/UploadService";
import path from "path";

let cachedMeta: { title: string; description: string; videoUrl: string } | null = null; // tạm lưu

const oauth2Client = new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
    process.env.YOUTUBE_REDIRECT_URI
);

export const redirectToYoutubeAuth = (req: Request, res: Response) => {
    const { title, description, videoUrl } = req.query;

    // Lưu lại để dùng sau khi xác thực
    cachedMeta = {
        title: (title as string) || "Unknown",
        description: (description as string) || "",
        videoUrl: decodeURIComponent(videoUrl as string) || ""
    };

    const url = getYoutubeAuthUrl();
    res.redirect(url);
};
export const handleYoutubeCallback = async (req: Request, res: Response) => {
    const code = req.query.code as string;

    try {
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // Sử dụng videoUrl nếu có, nếu không thì sử dụng đường dẫn mặc định
        let videoPath;
        if (cachedMeta?.videoUrl) {
            // Chuyển đổi URL thành đường dẫn file thực tế trên server
            // Ví dụ: http://localhost:3000/videos/final_output_with_music_1746265909087.mp4
            // -> D:\TKPM\Project\TKPM_Project\server\public\videos\final_output_with_music_1746265909087.mp4
            const urlParts = new URL(cachedMeta.videoUrl);
            const filename = path.basename(urlParts.pathname);
            videoPath = path.join(__dirname, "../../public/videos", filename);
        } else {
            videoPath = path.join(__dirname, "../../public/videodemo.mp4");
        }

        const title = cachedMeta?.title || "Video demo upload";
        const description = cachedMeta?.description || "This is a demo video uploaded from app";

        console.log("Uploading video with:", { title, description, videoPath });

        const uploadResult = await uploadVideoToYoutube(oauth2Client, videoPath, title, description);

        console.log("Upload successful:", uploadResult);

        // Redirect back to frontend with uploadSuccess=true
        res.redirect("http://localhost:5173/export-video?uploadSuccess=true");
    } catch (error) {
        console.error("Error during authentication or upload:", error);
        res.status(500).send("Error during authentication or upload.");
    }
};
