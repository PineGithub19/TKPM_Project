import { Request, Response, NextFunction } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import * as DBServices from '../services/DBServices';
import ScriptModel from '../models/LiteratureWork';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey as string);

const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-pro-exp-02-05',
});

const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 8192,
    responseMimeType: 'text/plain',
};

interface ScriptConfig {
    genre: string;
    audience: string;
    tone: string;
    duration: string;
}

class ScriptGenerateController {
    async generateScript(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { content, title, config } = req.body;

            if (!content || !title) {
                res.status(400).json({ message: 'Content and title are required' });
                return;
            }

            // Xử lý cấu hình (nếu có)
            const scriptConfig: ScriptConfig = config || {
                genre: 'educational',
                audience: 'general',
                tone: 'formal',
                duration: 'standard',
            };

            // Ánh xạ giá trị duration sang thời lượng thực tế
            const durationMap: Record<string, string> = {
                short: '2-3 minutes',
                standard: '4-5 minutes',
                long: '7-10 minutes',
            };

            const durationText = durationMap[scriptConfig.duration] || '4-5 minutes';

            // Khởi tạo chat session với context về văn học Việt Nam
            const chatSession = model.startChat({
                generationConfig,
                history: [
                    {
                        role: 'user',
                        parts: [
                            {
                                text: 'You will be a bot specializing in literary field. Learn about literary works in Vietnam. And will be a professional director who thinks of the script for the video about literary works on demand.',
                            },
                        ],
                    },
                    {
                        role: 'model',
                        parts: [
                            {
                                text: 'Okay, I understand. I\'m now in "Vietnamese Literature Bot & Script Director" mode. I will focus on Vietnamese literature, researching authors, works, historical context, and critical analysis. I will also adopt the persona of a professional director, thinking in terms of visuals, pacing, target audience, and overall impact when crafting video scripts.',
                            },
                        ],
                    },
                ],
            });

            // Tạo prompt cho việc tạo kịch bản với cấu hình
            const prompt = `
                Create a detailed video script for the literary work: "${title}"
                
                Content to analyze:
                ${content}

                Script Configuration:
                - Genre/Style: ${scriptConfig.genre}
                - Target Audience: ${scriptConfig.audience}
                - Tone: ${scriptConfig.tone}
                - Video Duration: ${durationText}

                Please provide:
                1. A compelling video title that appeals to ${scriptConfig.audience} audience
                2. Video purpose
                3. Detailed script with:
                   - Hook (0:00-0:15)
                   - Introduction (0:15-1:00)
                   - Main content (adjust based on ${durationText} duration)
                   - Cultural significance
                   - Conclusion
                4. Visual suggestions that match the ${scriptConfig.genre} style
                5. Audio recommendations that match the ${scriptConfig.tone} tone
                6. Pacing notes
                7. Tone guidelines consistent with ${scriptConfig.tone} presentation
                
                Make sure the script is appropriate for ${scriptConfig.audience} audience, using a ${scriptConfig.tone} tone, within a ${durationText} runtime, and presented in a ${scriptConfig.genre} style.
            `;

            // Gửi prompt và nhận kết quả
            const result = await chatSession.sendMessage(prompt);
            const script = result.response.text();

            res.status(200).json({
                success: true,
                script: script,
            });
        } catch (error) {
            console.error('Error generating script:', error);
            res.status(500).json({
                success: false,
                message: 'Error generating script',
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }

    async splitScript(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { promptId, script } = req.body;

            if (!script) {
                res.status(400).json({ message: 'Script content is required' });
                return;
            }

            const chatSession = model.startChat({
                generationConfig: {
                    ...generationConfig,
                    temperature: 0.2, // Lower temperature for more consistent splitting
                },
                history: [
                    {
                        role: 'user',
                        parts: [
                            {
                                text: 'You are a professional video script segmenter. Your job is to break down scripts into segments that can be used to create images for a video.',
                            },
                        ],
                    },
                    {
                        role: 'model',
                        parts: [
                            {
                                text: "I understand my role as a professional video script segmenter. I'll help break down scripts into meaningful segments that can be paired with images to create an effective video narrative.",
                            },
                        ],
                    },
                ],
            });

            const prompt = `
                Please analyze the following video script and break it down into 10-15 segments, each representing a key moment or scene that can be visualized with an image.

                Each segment should:
                1. Be concise (1-3 sentences)
                2. Describe a visual scene or concept
                3. Be suitable for generating an image
                4. When combined with other segments, tell a cohesive story

                The segments should follow the narrative flow of the original script. Try to extract the most visual and important scenes that would make compelling images for a video.

                Original script:
                ${script}

                Format your response as a list of segments separated by --- (triple dash), with no numbering or additional formatting. Just pure segments, each representing a scene or image to be created.
            `;

            const result = await chatSession.sendMessage(prompt);
            const segmentText = result.response.text();

            // Process the segments
            const segments = segmentText
                .split('---')
                .map((segment) => segment.trim())
                .filter((segment) => segment.length > 0);

            // Ensure we have a reasonable number of segments
            let finalSegments = segments;
            if (segments.length < 5) {
                // If too few segments were returned, use a simpler approach
                finalSegments = script
                    .split('\n\n')
                    .filter((para: string) => para.trim().length > 30 && para.trim().length < 500)
                    .slice(0, 15);
            } else if (segments.length > 20) {
                // If too many segments were returned, limit the count
                finalSegments = segments.slice(0, 20);
            }

            const data = await DBServices.updateDocumentById(ScriptModel, promptId as string, {
                content: finalSegments,
            });

            if (!data) {
                res.status(404).json({ message: 'Prompt not found or update failed' });
                return;
            }

            res.status(200).json({
                success: true,
                segments: finalSegments,
            });
        } catch (error) {
            console.error('Error splitting script:', error);
            res.status(500).json({
                success: false,
                message: 'Error splitting script',
                error: error instanceof Error ? error.message : 'Unknown error',
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
                        role: 'user',
                        parts: [
                            {
                                text: 'You are a professional script editor. Please help edit and improve the following video script according to the instructions.',
                            },
                        ],
                    },
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
                script: editedScript,
            });
        } catch (error) {
            console.error('Error editing script:', error);
            res.status(500).json({
                success: false,
                message: 'Error editing script',
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }

    async getScript(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { promptId } = req.query;

            if (!promptId) {
                res.status(400).json({ message: 'Prompt ID is required' });
                return;
            }

            const data = await DBServices.getDocumentById(ScriptModel, promptId as string);
            if (!data) {
                res.status(404).json({ message: 'Prompt not found' });
                return;
            }

            res.status(200).json({ scriptList: data.content });
        } catch (error) {
            console.error('Error getting script:', error);
            res.status(500).json({ message: 'Error getting script' });
        }
    }
}

export default ScriptGenerateController;
