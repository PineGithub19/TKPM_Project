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
import multer from 'multer';

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

// Cấu hình multer để xử lý file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const outputDir = path.join(process.cwd(), 'public', 'voices');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        cb(null, outputDir);
    },
    filename: function (req, file, cb) {
        cb(null, `voice_${Date.now()}.mp3`);
    }
});

const upload = multer({ storage: storage });

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
    speed?: number; // Tốc độ đọc, mặc định là 1.0, nhanh hơn > 1.0, chậm hơn < 1.0
};

export class VoiceController {
    // Original function to generate voice
    async generateVoice(dto: VoiceGenerationDto, promptId: string): Promise<string> {
        return new Promise(async (resolve, reject) => {
            // Xác định ngôn ngữ, mặc định là tiếng Việt
            const language: string = dto.language || 'vi';
            // Xác định tốc độ, mặc định là 1.0
            const speed: number = dto.speed || 1.5;

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
                tts.save(outputPath, async (err: Error | null) => {
                    if (err) {
                        console.error('Lỗi sinh giọng nói:', err);
                        reject(new Error('Không thể sinh giọng nói'));
                        return;
                    }

                    // Điều chỉnh tốc độ nếu khác 1.0
                    if (speed !== 1.0) {
                        try {
                            // Tạo đường dẫn cho file điều chỉnh tốc độ
                            const speedAdjustedFilename: string = `voicee_${Date.now()}.mp3`;
                            const speedAdjustedPath: string = path.join(outputDir, speedAdjustedFilename);

                            // Điều chỉnh tốc độ
                            await this.adjustAudioSpeed(outputPath, speedAdjustedPath, speed);

                            // Xóa file gốc
                            fs.unlinkSync(outputPath);

                            const relativePath = `/voices/${speedAdjustedFilename}`;

                            // Update database
                            const savePath = `http://localhost:${process.env.PORT}${relativePath}`;
                            if (promptId) {
                                await DBService.updateDocumentById(VoiceConfig, promptId, {
                                    $push: { audio_content: savePath },
                                } as any);
                            }

                            resolve(relativePath);
                        } catch (adjustError) {
                            console.error('Lỗi điều chỉnh tốc độ:', adjustError);
                            // Nếu lỗi điều chỉnh tốc độ, trả về file gốc
                            const relativePath = `/voices/${filename}`;
                            // Update database
                            const savePath = `http://localhost:${process.env.PORT}${relativePath}`;
                            if (promptId) {
                                await DBService.updateDocumentById(VoiceConfig, promptId, {
                                    $push: { audio_content: savePath },
                                } as any);
                            }
                            resolve(relativePath);
                        }
                    } else {
                        // Không điều chỉnh tốc độ
                        const relativePath = `/voices/${filename}`;
                        // Update database
                        const savePath = `http://localhost:${process.env.PORT}${relativePath}`;
                        if (promptId) {
                            await DBService.updateDocumentById(VoiceConfig, promptId, {
                                $push: { audio_content: savePath },
                            } as any);
                        }
                        resolve(relativePath);
                    }
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

    async uploadVoice(req: Request, res: Response): Promise<void> {
        try {
            const file = req.file;
            if (!file) {
                res.status(400).json({ success: false, message: 'No file uploaded' });
                return;
            }
    
            // Always normalize recorded audio
            const normalizedFileName = `voicee_${Date.now()}.mp3`;
            const normalizedFilePath = path.join(path.dirname(file.path), normalizedFileName);
    
            console.log('📢 Normalizing recorded audio...');
            
            try {
                await this.normalizeAudioFile(file.path, normalizedFilePath);
                
                // If normalization succeeded, use the normalized file
                fs.unlinkSync(file.path); // Remove original file
                const relativePath = `/voices/${normalizedFileName}`;
                console.log('📢 Voice uploaded and normalized:', relativePath);
                
                res.status(200).json({
                    success: true,
                    path: relativePath,
                    message: 'File uploaded successfully'
                });
            } catch (normalizationError) {
                console.error('⚠️ Audio normalization failed, using original file:', normalizationError);
                
                // If normalization fails, use the original file but rename it to match expected pattern
                const fallbackFileName = `voicee_original_${Date.now()}.mp3`;
                const fallbackFilePath = path.join(path.dirname(file.path), fallbackFileName);
                
                // Simple copy without processing
                fs.copyFileSync(file.path, fallbackFilePath);
                fs.unlinkSync(file.path); // Remove original file
                
                const relativePath = `/voices/${fallbackFileName}`;
                console.log('📢 Voice uploaded (without normalization):', relativePath);
                
                res.status(200).json({
                    success: true,
                    path: relativePath,
                    message: 'File uploaded (without normalization)'
                });
            }
        } catch (error) {
            console.error('Error uploading voice:', error);
            res.status(500).json({ success: false, message: 'Error uploading file' });
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

    private async normalizeAudioFile(inputPath: string, outputPath: string): Promise<void> {
        console.log('🔍 Normalizing recorded audio with simplified parameters...');
        
        return new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                // Use simpler parameters that are more likely to be compatible
                .audioCodec('libmp3lame')      // Use MP3 codec
                .audioBitrate('128k')          // Set bitrate
                .audioChannels(1)              // Use mono (1 channel)
                .audioFrequency(24000)         // Use 24kHz sample rate
                // Combine all audio filters into a single -af parameter
                .audioFilters([
                    'aresample=async=1',       // Fix asynchronous audio issues
                    'asetrate=24000',          // Set the sample rate
                    'aresample=24000',         // Resample to ensure consistency
                    'apad=pad_dur=0.5'         // Add 0.5s padding
                ])
                // Add metadata in a compatible way
                .outputOptions([
                    '-write_xing', '1',        // Add Xing header with duration info
                    '-id3v2_version', '3'      // Add ID3 metadata
                ])
                .save(outputPath)
                .on('start', (cmd) => {
                    console.log('⚙️ Normalizing audio with command:', cmd);
                })
                .on('end', () => {
                    console.log('✅ Audio normalized successfully:', outputPath);
                    
                    // Verify the output file
                    ffmpeg.ffprobe(outputPath, (err, metadata) => {
                        if (err) {
                            console.error('⚠️ Warning: Could not verify normalized audio:', err);
                        } else {
                            console.log('✓ Verified audio duration:', metadata.format.duration, 'seconds');
                        }
                        resolve();
                    });
                })
                .on('error', (err) => {
                    console.error('❌ Error normalizing audio:', err);
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

// Middleware để xử lý upload file
export const uploadVoiceMiddleware = upload.single('voice');
