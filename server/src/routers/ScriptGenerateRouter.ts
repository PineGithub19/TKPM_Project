import express from 'express';
import ScriptController from '../controllers/ScriptGenerateController';

const router = express.Router();
const scriptController = new ScriptController();

// Generate script from literary content
router.post('/generate', scriptController.generateScript);

// Edit existing script
router.post('/edit', scriptController.editScript);

// Split script into segments for image creation
router.post('/split', scriptController.splitScript);

export default router; 