import { GoogleGenerativeAI } from '@google/generative-ai';
import * as DBServices from '../DBServices';
import ScriptModel from '../../models/LiteratureWork';
import {
    ScriptConfig,
    ScriptJSON,
    FullContent,
    GenerateScriptParams,
    SplitScriptParams,
    EditScriptParams,
    ScriptGenerationResult,
    ScriptSplitResult,
    ScriptGetResult
} from '../interface/ScriptInterface';
import dotenv from 'dotenv';

dotenv.config();

class ScriptGenerateService {
    private genAI: GoogleGenerativeAI;
    private model: any;
    private generationConfig: any;
    private durationMap: Record<string, string>;

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is not defined in environment variables');
        }
        
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({
            model: 'gemini-2.0-pro-exp-02-05',
        });

        this.generationConfig = {
            temperature: 1,
            topP: 0.95,
            topK: 64,
            maxOutputTokens: 8192,
            responseMimeType: 'text/plain',
        };

        this.durationMap = {
            short: '2-3 minutes',
            standard: '4-5 minutes',
            long: '7-10 minutes',
        };
    }

    async generateScript(params: GenerateScriptParams): Promise<ScriptGenerationResult> {
        const { content, title, config } = params;

        if (!content || !title) {
            throw new Error('Content and title are required');
        }

        // Xử lý cấu hình (nếu có)
        const scriptConfig: ScriptConfig = config || {
            genre: 'educational',
            audience: 'general',
            tone: 'formal',
            duration: 'standard',
        };

        const durationText = this.durationMap[scriptConfig.duration] || '4-5 minutes';

        // Khởi tạo chat session với context về văn học Việt Nam
        const chatSession = this.model.startChat({
            generationConfig: this.generationConfig,
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
        const prompt = this.createGenerateScriptPrompt(title, content, scriptConfig, durationText);

        // Gửi prompt và nhận kết quả
        const result = await chatSession.sendMessage(prompt);
        const script = result.response.text().replace(/```(?:json)?|```/g, '').trim();

        return { script };
    }

    async splitScript(params: SplitScriptParams): Promise<ScriptSplitResult> {
        const { promptId, script, full_content } = params;

        if (!script) {
            throw new Error('Script content is required');
        }

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

        const data = await DBServices.updateDocumentById(ScriptModel, promptId, {
            content: finalSegments,
            full_content: full_content.content,
            title: full_content.title,
        });

        if (!data) {
            throw new Error('Prompt not found or update failed');
        }

        return {
            segments: finalSegments,
            imageDescriptions: imageDescriptions,
        };
    }

    async editScript(params: EditScriptParams): Promise<ScriptGenerationResult> {
        const { originalScript, editInstructions } = params;

        if (!originalScript || !editInstructions) {
            throw new Error('Original script and edit instructions are required');
        }

        const chatSession = this.model.startChat({
            generationConfig: this.generationConfig,
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

        const prompt = this.createEditScriptPrompt(originalScript, editInstructions);
        const result = await chatSession.sendMessage(prompt);
        const editedScript = result.response.text();

        return { script: editedScript };
    }

    async getScript(promptId: string): Promise<ScriptGetResult> {
        if (!promptId) {
            throw new Error('Prompt ID is required');
        }

        const data = await DBServices.getDocumentById(ScriptModel, promptId);
        if (!data) {
            throw new Error('Prompt not found');
        }

        return {
            scriptList: data.content,
            selectedLiterature: { content: data.full_content, title: data.title }
        };
    }

    private createGenerateScriptPrompt(title: string, content: string, scriptConfig: ScriptConfig, durationText: string): string {
        return `
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
            2. "segments": Mảng gồm 8 - 11 phân đoạn. Mỗi phân đoạn là một object có các trường:
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
    }

    private createEditScriptPrompt(originalScript: string, editInstructions: string): string {
        return `
            Original Script:
            ${originalScript}

            Edit Instructions:
            ${editInstructions}

            Please provide the edited version of the script, must keep its structure but incorporating the requested changes.
        `;
    }
}

export default ScriptGenerateService;