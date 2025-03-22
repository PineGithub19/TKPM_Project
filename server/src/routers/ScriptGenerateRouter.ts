import express from 'express';
import ScriptController from '../controllers/ScriptGenerateController';

const router = express.Router();
const scriptController = new ScriptController();

// Generate script from literary content
router.post('/generate', scriptController.generateScript);

// Edit existing script
router.post('/edit', scriptController.editScript);

export default router; 