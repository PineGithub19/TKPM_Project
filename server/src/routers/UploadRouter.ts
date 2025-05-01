import express from "express";
import { redirectToYoutubeAuth, handleYoutubeCallback } from "../controllers/UploadController";

const router = express.Router();

router.get("/auth", redirectToYoutubeAuth);
router.get("/auth/callback", handleYoutubeCallback); 

export default router;
