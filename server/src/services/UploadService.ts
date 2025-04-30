import { google } from "googleapis";
import fs from "fs";
import path from "path";

const oauth2Client = new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
    process.env.YOUTUBE_REDIRECT_URI
);

const scopes = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube"
];

export const getYoutubeAuthUrl = () => {
    return oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: scopes,
        prompt: "consent",
    });
};


export const uploadVideoToYoutube = async (
    oauth2Client: any,
    videoPath: string,
    title: string,
    description: string
) => {
    const youtube = google.youtube({ version: "v3", auth: oauth2Client });

    const filePath = path.resolve(videoPath);

    const res = await youtube.videos.insert({
        part: ["snippet", "status"],
        requestBody: {
            snippet: {
                title: title || "Default Title",
                description: description || "Default Description",
            },
            status: {
                privacyStatus: "public",
            },
        },
        media: {
            body: fs.createReadStream(filePath),
        },
    });

    return res.data;
};
