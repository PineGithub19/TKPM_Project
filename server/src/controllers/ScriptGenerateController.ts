import { Request, Response, NextFunction } from 'express';
import { scriptGenerateService } from '../services/ScriptGenerateService/ScriptGenerate.service';
import { GenerateScriptParams, SplitScriptParams, EditScriptParams } from '../services/interface/ScriptInterface';

class ScriptGenerateController {
    async generateScript(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { content, title, config } = req.body;

            const params: GenerateScriptParams = {
                content,
                title,
                config,
            };

            const result = await scriptGenerateService.generateScript(params);

            res.status(200).json({
                success: true,
                script: result.script,
            });
        } catch (error) {
            console.error('Error generating script:', error);

            // Kiểm tra xem error có phải là Error object không
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const statusCode = errorMessage.includes('required') ? 400 : 500;

            res.status(statusCode).json({
                success: false,
                message: 'Error generating script',
                error: errorMessage,
            });
        }
    }

    async splitScript(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { promptId, script, full_content } = req.body;

            console.log('CHECK full_content backend: ', full_content);

            const params: SplitScriptParams = {
                promptId,
                script,
                full_content,
            };

            const result = await scriptGenerateService.splitScript(params);

            res.status(200).json({
                success: true,
                segments: result.segments,
                imageDescriptions: result.imageDescriptions,
            });
        } catch (error) {
            console.error('Error splitting script:', error);

            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const statusCode = errorMessage.includes('required') || errorMessage.includes('not found') ? 400 : 500;

            res.status(statusCode).json({
                success: false,
                message: 'Error splitting script',
                error: errorMessage,
            });
        }
    }

    async editScript(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { originalScript, editInstructions } = req.body;

            const params: EditScriptParams = {
                originalScript,
                editInstructions,
            };

            const result = await scriptGenerateService.editScript(params);

            res.status(200).json({
                success: true,
                script: result.script,
            });
        } catch (error) {
            console.error('Error editing script:', error);

            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const statusCode = errorMessage.includes('required') ? 400 : 500;

            res.status(statusCode).json({
                success: false,
                message: 'Error editing script',
                error: errorMessage,
            });
        }
    }

    async getScript(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { promptId } = req.query;

            if (typeof promptId !== 'string') {
                res.status(400).json({ message: 'Prompt ID must be a string' });
                return;
            }

            const result = await scriptGenerateService.getScript(promptId);

            res.status(200).json(result);
        } catch (error) {
            console.error('Error getting script:', error);

            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const statusCode = errorMessage.includes('required') || errorMessage.includes('not found') ? 404 : 500;

            res.status(statusCode).json({
                success: false,
                message: 'Error getting script',
                error: errorMessage,
            });
        }
    }
}

export default ScriptGenerateController;
