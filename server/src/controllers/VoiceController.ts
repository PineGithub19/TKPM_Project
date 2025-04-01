import Gtts = require('gtts');
import * as fs from 'fs';
import * as path from 'path';

// Định nghĩa kiểu enum cho tone
enum ToneStyle {
  Formal = 'formal',
  Epic = 'epic',
  Humorous = 'humorous'
}

// Định nghĩa kiểu dữ liệu cho đầu vào
type VoiceGenerationDto = {
  text: string;
  language?: string;
  tone?: ToneStyle;
  outputPath?: string;
};

export class VoiceController {
  generateVoice(dto: VoiceGenerationDto): Promise<string> {
    return new Promise((resolve, reject) => {
      // Xác định ngôn ngữ, mặc định là tiếng Việt
      const language: string = dto.language || 'vi';
      
      // Xử lý văn bản dựa trên tone
      const processedText: string = this.processToneStyle(dto.text, dto.tone);
      
      // Tạo đường dẫn file âm thanh
      const outputDir: string = path.join(process.cwd(), 'public', 'voices');
      
      // Tạo thư mục nếu chưa tồn tại
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      const filename: string = `voice_${Date.now()}.mp3`;
      const outputPath: string = path.join(outputDir, filename);
      
      try {
        // Sử dụng Google Text-to-Speech
        const tts = new Gtts(processedText, language);
        
        // Lưu file âm thanh
        tts.save(outputPath, (err: Error | null) => {
          if (err) {
            console.error('Lỗi sinh giọng nói:', err);
            reject(new Error('Không thể sinh giọng nói'));
          }
          resolve(`/voices/${filename}`);
        });
      } catch (error) {
        console.error('Lỗi sinh giọng nói:', error);
        reject(new Error('Không thể sinh giọng nói'));
      }
    });
  }

  private processToneStyle(text: string, tone?: ToneStyle): string {
    switch(tone) {
      case ToneStyle.Formal:
        return `Kính thưa quý vị, ${text}`;
      case ToneStyle.Epic:
        return `Vĩ đại và hùng tráng, ${text}`;
      case ToneStyle.Humorous:
        return `À nào, chuyện này thì thế đấy, ${text}`;
      default:
        return text;
    }
  }
}
