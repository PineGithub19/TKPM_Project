import { google } from 'googleapis';
import { Request, Response } from 'express';
import session from 'express-session';

// Thông tin client từ Google Developer Console
const YOUTUBE_CLIENT_ID = process.env.YOUTUBE_CLIENT_ID!;
const YOUTUBE_CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET!;
const YOUTUBE_REDIRECT_URI = process.env.YOUTUBE_REDIRECT_URI!;

const oauth2Client = new google.auth.OAuth2(
  YOUTUBE_CLIENT_ID,
  YOUTUBE_CLIENT_SECRET,
  YOUTUBE_REDIRECT_URI
);

const SCOPES = ['https://www.googleapis.com/auth/youtube.upload']; // Quyền upload video lên YouTube

// Route bắt đầu xác thực
export const initiateOAuth = (req: Request, res: Response) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Để có thể lấy refresh token
    scope: SCOPES,
  });
  res.redirect(authUrl);
};

// Callback route để nhận token
export const handleOAuthCallback = async (req: Request, res: Response) => {
  const code = req.query.code as string;

  try {
    // Lấy token truy cập từ Google
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Lưu token vào session
    req.session.tokens = tokens;
    res.send('Authentication successful! You can now upload videos.');
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).send('Error during authentication: ' + error.message);
    } else {
      res.status(500).send('Unknown error occurred during authentication');
    }
  }  
};

// Xác thực bằng token lưu trong session
export const authenticateWithToken = (req: Request) => {
  if (req.session.tokens) {
    oauth2Client.setCredentials(req.session.tokens);
  } else {
    throw new Error('No authentication token available');
  }
};

export default oauth2Client;
