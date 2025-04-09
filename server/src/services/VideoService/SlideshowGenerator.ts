// import * as fs from "fs";
// import * as path from "path";
// import ffmpegStatic from "ffmpeg-static";
const fs = require('fs');
const path = require('path');
const ffmpegStatic = require('ffmpeg-static');
const ffmpeg = require('fluent-ffmpeg');
const ffprobeStatic = require('ffprobe-static');

// Set ffmpeg path
if (ffmpegStatic) {
    ffmpeg.setFfmpegPath(ffmpegStatic);
}
if (ffprobeStatic) {
    ffmpeg.setFfprobePath(ffprobeStatic.path);
}
// Types
interface Resolution {
    width: number;
    height: number;
}

interface Effects {
    fade: boolean;
    fadeInDuration: number;
    fadeOutDuration: number;
    zoomDirection: 'in' | 'out' | 'none';
    zoomAmount: number;
    panDirection: 'left' | 'right' | 'up' | 'down' | 'none';
    panAmount: number;
}

interface ImageInfo {
    path: string;
    audioPath?: string;
    subtitle?: string;
    effects?: Effects;
}

interface SlideshowConfig {
    // Directories and paths
    imagesDir: string;
    audiosDir: string;
    outputDir: string;
    finalOutputPath: string;

    // Images
    images?: ImageInfo[];

    // Video configuration
    videoDuration: number; // Duration per image (seconds)
    resolution: Resolution;

    // Default effects
    defaultEffects: Effects;

    // Advanced options
    cleanupTemp: boolean;
}

// Default configuration
const defaultConfig: SlideshowConfig = {
    // Directories and paths
    imagesDir: path.join(__dirname, 'images'),
    audiosDir: path.join(__dirname, 'audios'),
    outputDir: path.join(__dirname, 'tmp_videos'),
    finalOutputPath: path.join(__dirname, 'final_output.mp4'),

    // Video configuration
    videoDuration: 5, // Duration per image (seconds)
    resolution: { width: 1920, height: 1080 },

    // Audio configuration
    // audioPath: path.join(__dirname, 'background.mp3'),

    // Default effects
    defaultEffects: {
        fade: true,
        fadeInDuration: 1,
        fadeOutDuration: 1,
        zoomDirection: 'none',
        zoomAmount: 1,
        panDirection: 'none',
        panAmount: 0.1,
    },

    // Advanced options
    cleanupTemp: true,
};

// Main class for slideshow generation
class SlideshowGenerator {
    private config: SlideshowConfig;
    private videoFiles: string[] = [];
    private images: ImageInfo[] = [];
    private totalDuration: number = 0;

    constructor(userConfig: Partial<SlideshowConfig> = {}) {
        // Merge user configuration with default configuration
        this.config = { ...defaultConfig, ...userConfig };

        // Create output directory if it doesn't exist
        if (!fs.existsSync(this.config.outputDir)) {
            fs.mkdirSync(this.config.outputDir, { recursive: true });
        }
    }

    // Initialize and get image list
    initialize(): this {
        // Get image list from directory or provided array
        if (Array.isArray(this.config.images)) {
            this.images = this.config.images;
        } else {
            this.images = fs
                .readdirSync(this.config.imagesDir)
                .filter((file: any) => /\.(jpg|jpeg|png|webp)$/i.test(file))
                .map((filename: any) => ({
                    path: path.join(this.config.imagesDir, filename),
                    duration: this.config.videoDuration,
                    title: filename.replace(/\.(jpg|jpeg|png|webp)$/i, ''),
                }));
        }

        console.log(`🖼️ Found ${this.images.length} images`);
        return this;
    }

    // Create video from a single image with effects
    private async createVideoFromImage(imageInfo: ImageInfo | string, index: number): Promise<void> {
        const inputImage = typeof imageInfo === 'string' ? imageInfo : imageInfo.path;
        const imgInfo = typeof imageInfo === 'string' ? { path: inputImage } : imageInfo;

        const audioPath = imgInfo.audioPath;
        const audioDuration = await new Promise<number>((resolve, reject) => {
            ffmpeg.ffprobe(audioPath, (err: any, metadata: any) => {
                if (err)
                {
                    console.error(`❌ Lỗi khi lấy metadata audio:`, err);
                    reject(err);
                }
                resolve(metadata.format.duration || this.config.videoDuration);
            });
        });
        // const audioDuration = 10;
        const subtitle = imgInfo.subtitle || 'hdasjdasjdjksadhkashdjkahdaskd';

        const outputVideo = path.join(this.config.outputDir, `video_${index}.mp4`);

        console.log(`imageInfo:`, imageInfo);
        console.log(`🎬 Bắt đầu xử lý video ${index + 1}:`);
        return new Promise<void>((resolve, reject) => {
            const filterChain = [
                `[0:v]scale=${this.config.resolution.width}:${this.config.resolution.height}:force_original_aspect_ratio=decrease`,
                `pad=${this.config.resolution.width}:${this.config.resolution.height}:(ow-iw)/2:(oh-ih)/2:black`,
                `fade=t=in:st=0:d=1`,
                `fade=t=out:st=${audioDuration - 1}:d=1`,
                `drawtext=text='${subtitle}':fontcolor=white:fontsize=36:x=(w-text_w)/2:y=h-120:box=1:boxcolor=black@0.5:boxborderw=10`,
            ];
            const filterComplex = `${filterChain.join(',')}[v]`;

            ffmpeg()
                .input(inputImage)
                .inputOptions(['-loop', '1'])
                .input(audioPath)
                .complexFilter(filterComplex, ["v"])
                .outputOptions([
                    '-map',
                    '1:a',
                    '-t',
                    audioDuration.toString(), // Explicitly set output duration
                    '-preset',
                    'ultrafast',
                    '-c:v',
                    'libx264',
                    '-crf',
                    '23',
                    '-pix_fmt',
                    'yuv420p',
                    '-movflags',
                    '+faststart',
                ])
                .on('start', (cmd: any) => {
                    console.log('⚙️ FFmpeg command:', cmd);
                })
                .on('end', () => {
                    console.log(`✅ Video ${index + 1} hoàn thành`);
                    this.videoFiles.push(outputVideo);
                    resolve();
                })
                .on('error', (err: any) => {
                    console.error(`❌ Lỗi video ${index + 1}:`, err);
                    reject(err);
                })
                .save(outputVideo);
        });
    }

    // Clean up temporary files
    private cleanUpTempFiles(): void {
        if (!this.config.cleanupTemp) return;

        console.log('🗑️ Deleting temporary files...');

        // Delete each temporary video file
        this.videoFiles.forEach((file) => {
            if (fs.existsSync(file)) {
                fs.unlinkSync(file);
                console.log(`✔ Deleted: ${file}`);
            }
        });

        // Delete file list
        const fileListPath = path.join(this.config.outputDir, 'file_list.txt');
        if (fs.existsSync(fileListPath)) {
            fs.unlinkSync(fileListPath);
            console.log(`✔ Deleted: ${fileListPath}`);
        }

        //Delete audio files
        const audioFilesList = fs.readdirSync(this.config.audiosDir).filter((file: any) => /\.(mp3)$/i.test(file));
        audioFilesList.forEach((audioFile: any) => {
            const audioPath = path.join(this.config.audiosDir, audioFile);
            if (fs.existsSync(audioPath)) {
                fs.unlinkSync(audioPath);
                console.log(`✔ Deleted: ${audioPath}`);
            }
        });

        //Delete images files
        const imagesFilesList = fs.readdirSync(this.config.imagesDir).filter((file: any) => /\.(jpg|jpeg|png|webp)$/i.test(file));
        imagesFilesList.forEach((imageFile: any) => {
            const imagePath = path.join(this.config.imagesDir, imageFile);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
                console.log(`✔ Deleted: ${imagePath}`);
            }
        });

        console.log('🚀 Cleanup complete!');
    }

    // Create final video from individual segments
    private async createFinalVideo(): Promise<void> {
        console.log('🎬 Creating final video...');
        const fileListPath = path.join(this.config.outputDir, 'file_list.txt');

        // Create file list for ffmpeg
        const fileListContent = this.videoFiles.map((file) => `file '${file}'`).join('\n');
        fs.writeFileSync(fileListPath, fileListContent);

        const outputPath = this.config.finalOutputPath;
        return new Promise<void>((resolve, reject) => {
            ffmpeg()
                .input(fileListPath)
                .inputOptions(['-f', 'concat', '-safe', '0'])
                .outputOptions(['-c', 'copy'])
                .on('start', (cmd: any) => {
                    console.log('⚙️ FFmpeg concat command:', cmd);
                })
                .on('end', () => {
                    console.log('✅ Video cuối cùng đã được tạo:', outputPath);
                    fs.unlinkSync(fileListPath); // Xóa file tạm
                    resolve();
                })
                .on('error', (err: any) => {
                    console.error('❌ Lỗi khi nối video:', err);
                    reject(err);
                })
                .save(outputPath);
        });
    }

    // Process the entire workflow
    async generate(): Promise<{
        success: boolean;
        outputPath?: string;
        hardSubsPath?: string | null;
        totalDuration?: number;
        error?: any;
    }> {
        try {
            // Initialize and get image list
            this.initialize();

            // Process each image
            for (let i = 0; i < this.images.length; i++) {
                await this.createVideoFromImage(this.images[i], i);
            }

            // Create final video
            await this.createFinalVideo();

            // Cleanup
            this.cleanUpTempFiles();
            const result = {
                success: true,
                outputPath: this.config.finalOutputPath,
            };
            console.log('🎉 Video generation complete!', result);
            return result;
        } catch (error) {
            console.error('❌ Error during video generation:', error);
            return { success: false, error };
        }
    }
}


// EXPORT CLASS FOR USE ELSEWHERE
export default SlideshowGenerator;
////////New config

// {
//     "config": {
//       "images": [
//         {
//           "path": "C:/Users/qthan/OneDrive/Desktop/TKPM_new/TKPM_Project/server/src/services/VideoService/images/i1.jpg",
//           "audioPath": "C:/Users/qthan/OneDrive/Desktop/TKPM_new/TKPM_Project/server/src/services/VideoService/audios/audio1.mp3",
//           "subtitle": "Test subtitles bro bro bro"
//         },
//         {
//           "path": "https://scontent.fsgn5-8.fna.fbcdn.net/v/t39.30808-6/489110193_122219349944072824_2709652249165950530_n.jpg?stp=dst-jpg_p600x600_tt6&_nc_cat=109&ccb=1-7&_nc_sid=833d8c&_nc_ohc=u5nOOk3cSwMQ7kNvwGFhBvy&_nc_oc=AdljfX-5_VCr8ENMOHDE6iLgzAg1uEdYkeasJxXL0mF3RPJcSBa1onotqN4z4ExhqbnBghzcyaAx3FxWSxv0PAzd&_nc_pt=1&_nc_zt=23&_nc_ht=scontent.fsgn5-8.fna&_nc_gid=zYKZ6X-b7X64OoL74DoecQ&oh=00_AfGxOYjRatKmvC83JYnrxsdiaR346ml1H0mfIemJ1Wdz0Q&oe=67FC3814",
//           "audioPath": "C:/Users/qthan/OneDrive/Desktop/TKPM_new/TKPM_Project/server/src/services/VideoService/audios/audio1.mp3",
//           "subtitle": "Vào ngày 7 tháng 4 năm 2025, công ty công nghệ sinh học Colossal Biosciences thông báo \n đã thành công trong việc tạo ra ba con sói con mang đặc điểm của loài sói khổng lồ"
//         }
//       ],
//       "resolution": {
//         "width": 1920,
//         "height": 1080
//       },
//       "cleanupTemp": false
//     }
//   }
  