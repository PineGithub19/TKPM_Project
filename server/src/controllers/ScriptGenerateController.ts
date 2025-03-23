import { Request, Response, NextFunction } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey as string);

const model = genAI.getGenerativeModel({
    model: "gemini-2.0-pro-exp-02-05",
});

const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 8192,
    responseMimeType: "text/plain",
};

class ScriptGenerateController {
    async generateScript(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { content, title } = req.body;

            if (!content || !title) {
                res.status(400).json({ message: 'Content and title are required' });
                return;
            }

            // Khởi tạo chat session với context về văn học Việt Nam
            const chatSession = model.startChat({
                generationConfig,
                history: [
                    {
                        role: "user",
                        parts: [
                            { text: "You will be a bot specializing in literary field. Learn about literary works in Vietnam. And will be a professional director who thinks of the script for the video about literary works on demand." }
                        ],
                    },
                    {
                        role: "model",
                        parts: [
                            { text: "Okay, I understand. I'm now in \"Vietnamese Literature Bot & Script Director\" mode. I will focus on Vietnamese literature, researching authors, works, historical context, and critical analysis. I will also adopt the persona of a professional director, thinking in terms of visuals, pacing, target audience, and overall impact when crafting video scripts." }
                        ],
                    }
                ],
            });

            // Tạo prompt cho việc tạo kịch bản
            const prompt = `
                Create a detailed video script for the literary work: "${title}"
                
                Content to analyze:
                ${content}

                Please provide:
                1. A compelling video title
                2. Target audience
                3. Video purpose
                4. Detailed script with:
                   - Hook (0:00-0:15)
                   - Introduction (0:15-1:00)
                   - Main content (1:00-3:00)
                   - Cultural significance (3:00-4:00)
                   - Conclusion (4:00-4:30)
                5. Visual suggestions
                6. Audio recommendations
                7. Pacing notes
                8. Tone guidelines
            `;

            // Gửi prompt và nhận kết quả
            const result = await chatSession.sendMessage(prompt);
            const script = result.response.text();

            res.status(200).json({
                success: true,
                script: script
            });

        } catch (error) {
            console.error('Error generating script:', error);
            res.status(500).json({ 
                success: false,
                message: 'Error generating script',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    async editScript(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { originalScript, editInstructions } = req.body;

            if (!originalScript || !editInstructions) {
                res.status(400).json({ message: 'Original script and edit instructions are required' });
                return;
            }

            const chatSession = model.startChat({
                generationConfig,
                history: [
                    {
                        role: "user",
                        parts: [
                            { text: "You are a professional script editor. Please help edit and improve the following video script according to the instructions." }
                        ],
                    }
                ],
            });

            const prompt = `
                Original Script:
                ${originalScript}

                Edit Instructions:
                ${editInstructions}

                Please provide the edited version of the script, maintaining its structure but incorporating the requested changes.
            `;

            const result = await chatSession.sendMessage(prompt);
            const editedScript = result.response.text();

            res.status(200).json({
                success: true,
                script: editedScript
            });

        } catch (error) {
            console.error('Error editing script:', error);
            res.status(500).json({ 
                success: false,
                message: 'Error editing script',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
}

export default ScriptGenerateController; 