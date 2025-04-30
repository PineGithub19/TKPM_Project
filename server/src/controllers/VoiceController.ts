import Gtts = require('gtts');
import * as fs from 'fs';
import * as path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as DBService from '../services/DBServices';
import VoiceConfig from '../models/VoiceConfig';
import { Request, Response, NextFunction } from 'express';

// Use promisify to convert callback-based functions to promise-based
const execPromise = promisify(exec);

// Ensure ffmpeg path is set
if (ffmpegPath) {
    ffmpeg.setFfmpegPath(ffmpegPath as string);
}

// Fix: Access the path property from ffprobe-static
const ffprobeStatic = require('ffprobe-static');
if (ffprobeStatic && ffprobeStatic.path) {
    ffmpeg.setFfprobePath(ffprobeStatic.path);
}

// Định nghĩa kiểu enum cho tone
enum ToneStyle {
    Formal = 'formal',
    Epic = 'epic',
    Humorous = 'humorous',
}

// Định nghĩa kiểu dữ liệu cho đầu vào
type VoiceGenerationDto = {
    text: string;
    language?: string;
    tone?: ToneStyle;
    outputPath?: string;
    duration?: number; // Duration in milliseconds for SRT segments
    audio_content?: string[];
};

export class VoiceController {
    // Original function to generate voice
    async generateVoice(dto: VoiceGenerationDto, promptId: string): Promise<string> {
        return new Promise(async (resolve, reject) => {
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

                // Update database
                const savePath = `http://localhost:${process.env.PORT}/voices/${filename}`;
                await DBService.updateDocumentById(VoiceConfig, promptId, {
                    audio_content: [savePath],
                });
            } catch (error) {
                console.error('Lỗi sinh giọng nói:', error);
                reject(new Error('Không thể sinh giọng nói'));
            }
        });
    }

    // New function for generating voice with specific duration for SRT
    async generateSRTVoice(dto: VoiceGenerationDto): Promise<string> {
        try {
            // First generate regular voice
            const voicePath = await this.generateVoice(dto, '');

            // If no duration specified, return the regular voice
            if (!dto.duration) {
                return voicePath;
            }

            // Get full path for the voice file
            const originalFilePath = path.join(process.cwd(), 'public', voicePath);

            // Get the duration of the original audio
            const originalDuration = await this.getAudioDuration(originalFilePath);

            // Calculate the required speed adjustment
            const targetDuration = dto.duration / 1000; // Convert ms to seconds

            // If the durations are close enough, no need to adjust
            if (Math.abs(originalDuration - targetDuration) < 0.1) {
                return voicePath;
            }

            // Calculate speed factor
            const speedFactor = originalDuration / targetDuration;

            // Create a new output path for the adjusted audio
            const outputDir: string = path.join(process.cwd(), 'public', 'voices');
            const adjustedFilename: string = `voice_adjusted_${Date.now()}.mp3`;
            const adjustedFilePath: string = path.join(outputDir, adjustedFilename);

            // Adjust the audio speed to match the required duration
            await this.adjustAudioSpeed(originalFilePath, adjustedFilePath, speedFactor);

            // Remove the original file
            fs.unlinkSync(originalFilePath);

            return `/voices/${adjustedFilename}`;
        } catch (error: any) {
            console.error('Error generating SRT voice:', error);
            throw new Error(`Không thể sinh giọng nói với thời lượng cụ thể: ${error.message}`);
        }
    }

    async getVoices(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { promptId } = req.query;
            if (!promptId) {
                res.status(400).json({ message: 'Prompt ID is required' });
            }

            const data = await DBService.getDocumentById(VoiceConfig, promptId as string);
            if (!data) {
                res.status(404).json({ message: 'Prompt not found' });
            }

            res.status(200).json({ voiceList: data?.audio_content });
        } catch (error) {
            console.error('Error getting voices:', error);
            res.status(500).json({ message: 'Error getting voices' });
        }
    }

    // Helper function to get audio duration
    private async getAudioDuration(filePath: string): Promise<number> {
        return new Promise((resolve, reject) => {
            ffmpeg.ffprobe(filePath, (err, metadata) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(metadata.format.duration || 0);
            });
        });
    }

    // Helper function to adjust audio speed
    private async adjustAudioSpeed(inputPath: string, outputPath: string, speedFactor: number): Promise<void> {
        return new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .audioFilters(`atempo=${speedFactor > 2.0 ? 2.0 : speedFactor < 0.5 ? 0.5 : speedFactor}`)
                .save(outputPath)
                .on('end', () => {
                    resolve();
                })
                .on('error', (err) => {
                    reject(err);
                });
        });
    }

    private processToneStyle(text: string, tone?: ToneStyle): string {
        switch (tone) {
            case ToneStyle.Formal:
                return `${text}`;
            case ToneStyle.Epic:
                return `${text}`;
            case ToneStyle.Humorous:
                return `${text}`;
            default:
                return text;
        }
    }
}
