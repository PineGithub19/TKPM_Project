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

interface ScriptSegment {
    title: string;
    content: string;
    image_description: string;
}

interface ScriptJSON {
    title: string;
    segments: ScriptSegment[];
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
            Tạo kịch bản video chi tiết cho tác phẩm văn học: "${title}"
            
            Nội dung phân tích:
            ${content}
        
            Cấu hình kịch bản:
            - Thể loại/Phong cách: ${scriptConfig.genre}
            - Đối tượng người xem: ${scriptConfig.audience}
            - Giọng điệu: ${scriptConfig.tone}
            - Thời lượng video: ${durationText}
            
            Yêu cầu đầu ra: Trả về JSON gồm 2 phần:
            1. "title": Tiêu đề video hấp dẫn phù hợp với đối tượng "${scriptConfig.audience}"
            2. "segments": Mảng gồm 10-13 phân đoạn. Mỗi phân đoạn là một object có các trường:
               - "title": Tên phân đoạn ngắn gọn
               - "content": Lời bình cho phân đoạn (tối đa 50 từ), súc tích và cảm xúc
               - "image_description": Mô tả cảnh hoặc hình ảnh minh họa sống động và chi tiết, thể hiện rõ nội dung phân đoạn. Mô tả cần mang tính hình ảnh cao, nhấn mạnh vào yếu tố cảm xúc, bối cảnh, ánh sáng, màu sắc, biểu cảm nhân vật, và không khí tổng thể. Phong cách hình ảnh phải phù hợp với thể loại tác phẩm, chủ đề nội dung và thị hiếu của ${scriptConfig.audience}. Hướng đến việc tạo ra những bức ảnh giàu tính nghệ thuật, độc đáo và ấn tượng thị giác.            
            Yêu cầu:
            - Tạo ra một kịch bản video hấp dẫn, dễ hiểu và có tính giáo dục cao
            - Luôn viết về tác phẩm văn học gốc, không viết về các chủ đề khác như phim ảnh, tác giả, chuyển thể,... quá nhiều
            - Các phân đoạn có nội dung mạch lạc, kết nối thành một câu chuyện rõ ràng
            - Ngôn ngữ tiếng Việt, dễ hiểu với đối tượng "${scriptConfig.audience}"
            - Sử dụng giọng điệu "${scriptConfig.tone}" xuyên suốt
            - Thể hiện được phong cách "${scriptConfig.genre}" và thời lượng "${durationText}"
            - Tính sáng tạo và chất thơ cao, truyền cảm hứng và hình dung được cảnh tượng
            
            CHỈ TRẢ VỀ JSON THUẦN TÚY, KHÔNG CÓ MARKUP, KHÔNG CÓ BACKTICKS, KHÔNG CÓ TIÊU ĐỀ CODE BLOCK.
        `;

            // Gửi prompt và nhận kết quả
            const result = await chatSession.sendMessage(prompt);
            const script = result.response.text().replace(/```(?:json)?|```/g, '').trim();

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
            const { promptId, script, full_content } = req.body;

            console.log("CHECK full_content backend: ", full_content);

            if (!script) {
                res.status(400).json({ message: 'Script content is required' });
                return;
            }

            // const chatSession = model.startChat({
            //     generationConfig: {
            //         ...generationConfig,
            //         temperature: 0.2, // Lower temperature for more consistent splitting
            //     },
            //     history: [
            //         {
            //             role: 'user',
            //             parts: [
            //                 {
            //                     text: 'You are a professional video script segmenter. Your job is to break down scripts into segments that can be used to create images for a video.',
            //                 },
            //             ],
            //         },
            //         {
            //             role: 'model',
            //             parts: [
            //                 {
            //                     text: "I understand my role as a professional video script segmenter. I'll help break down scripts into meaningful segments that can be paired with images to create an effective video narrative.",
            //                 },
            //             ],
            //         },
            //     ],
            // });

            // const prompt = `
            //     Please analyze the following video script and break it down into 10-15 segments, each representing a key moment or scene that can be visualized with an image.

            //     Each segment should:
            //     1. Be concise (1-3 sentences)
            //     2. Describe a visual scene or concept
            //     3. Be suitable for generating an image
            //     4. When combined with other segments, tell a cohesive story

            //     The segments should follow the narrative flow of the original script. Try to extract the most visual and important scenes that would make compelling images for a video.

            //     Original script:
            //     ${script}

            //     Format your response as a list of segments separated by --- (triple dash), with no numbering or additional formatting. Just pure segments, each representing a scene or image to be created.
            // `;

            // const result = await chatSession.sendMessage(prompt);
            // const segmentText = result.response.text();

            // // Process the segments
            // const segments = segmentText
            //     .split('---')
            //     .map((segment) => segment.trim())
            //     .filter((segment) => segment.length > 0);


            const scriptText: ScriptJSON = JSON.parse(script.replace(/```(?:json)?|```/g, '').trim());

            const segments = scriptText.segments.map(seg => seg.content);
            const imageDescriptions = scriptText.segments.map(seg => seg.image_description);
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
                full_content: full_content,
            });

            if (!data) {
                res.status(404).json({ message: 'Prompt not found or update failed' });
                return;
            }

            res.status(200).json({
                success: true,
                segments: finalSegments,
                imageDescriptions: imageDescriptions,
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

                Please provide the edited version of the script, must keep its structure but incorporating the requested changes.
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

            res.status(200).json({ scriptList: data.content, selectedLiterature: data.full_content });
        } catch (error) {
            console.error('Error getting script:', error);
            res.status(500).json({ message: 'Error getting script' });
        }
    }
}

export default ScriptGenerateController;
