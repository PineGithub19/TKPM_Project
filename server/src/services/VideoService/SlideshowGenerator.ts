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

interface ImageInfo {
    path: string;
    audioPath?: string;
    subtitle?: string;
    effects?: EditOptions;
}

interface SlideshowConfig {
    // Directories and paths
    imagesDir?: string;
    outputDir?: string;
    finalOutputPath: string;
    finalWithMusicPath: string; // Path to final output video with music

    // Images
    images?: ImageInfo[];

    // Video configuration
    videoDuration: number; // Duration per image (seconds)
    resolution: Resolution;

    backgroundMusic?: string; // Path to background music
    backgroundMusicVolume?: number; // Volume level for background music (0.0 to 1.0)

    // Advanced options
    cleanupTemp: boolean;
}

// Default configuration
const defaultConfig: SlideshowConfig = {
    // Directories and paths
    // imagesDir: path.join(__dirname, 'images'),
    outputDir: path.join(process.cwd(), 'public/videos/tmp_videos'),
    finalOutputPath: path.join(process.cwd(), 'public/videos', `final_output_${Date.now()}.mp4`),
    finalWithMusicPath: path.join(process.cwd(), 'public/videos', `final_output_with_music_${Date.now()}.mp4`),
    // Video configuration
    videoDuration: 5, // Duration per image (seconds)
    resolution: { width: 1920, height: 1080 },

    // Audio configuration
    // audioPath: path.join(__dirname, 'background.mp3'),

    // Advanced options
    cleanupTemp: true,
};

interface EditOptions {
    resolution?: { width: number; height: number };
    brightness?: number;
    contrast?: number;
    volume?: number;
    fade?: boolean;
    kenBurns?: boolean;
    kenBurnsDirection?: 'leftToRight' | 'rightToLeft' | 'topToBottom' | 'bottomToTop';
    crop?: { width: number; height: number; x: number; y: number };
    rotate?: number; // degrees: 90, 180, etc.
    blur?: number; // e.g., 5.0 for strong blur
}

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

        const publicVideosPath = path.join(process.cwd(), 'public/videos');
        if (!fs.existsSync(publicVideosPath)) {
            fs.mkdirSync(publicVideosPath, { recursive: true });
        }

        console.log(`🖼️ Found ${this.images.length} images`);
        return this;
    }

    public async createVideoFromImage(
        imageInfo: ImageInfo | string,
        index: number,
        editOptions?: EditOptions,
    ): Promise<void> {
        const inputImage = typeof imageInfo === 'string' ? imageInfo : imageInfo.path;
        const imgInfo = typeof imageInfo === 'string' ? { path: inputImage } : imageInfo;
        const isGif = inputImage.endsWith('.gif');
        const audioPath = imgInfo.audioPath || '';
        const subtitle = imgInfo.subtitle || '';
        const {
            resolution = this.config.resolution,
            brightness = 0,
            contrast = 1,
            volume = 1,
            fade = true,
            kenBurns = false,
            kenBurnsDirection = 'leftToRight',
            crop = {
                width: resolution.width,
                height: resolution.height,
                x: 0,
                y: 0,
            },
            rotate = 0,
            blur = 0,
        } = editOptions || {};

        const rotateRad = (rotate * Math.PI) / 180;

        let audioDuration = this.config.videoDuration; // Default to video duration
        if (audioPath) {
            audioDuration = await new Promise<number>((resolve, reject) => {
                ffmpeg.ffprobe(audioPath, (err: any, metadata: any) => {
                    if (err) {
                        console.error(`❌ Lỗi khi lấy metadata audio:`, err);
                        reject(err);
                    }
                    resolve(metadata.format.duration || this.config.videoDuration);
                });
            });
        }

        const outputVideo = path.join(this.config.outputDir, `video_${index}.mp4`);
        console.log(`🎬 Bắt đầu xử lý video ${index + 1}:`);

        return new Promise<void>((resolve, reject) => {
            const filters: string[] = [];

            // Base scale and padding
            filters.push(
                `scale=${resolution.width}:${resolution.height}:force_original_aspect_ratio=decrease`,
                `pad=${resolution.width}:${resolution.height}:(ow-iw)/2:(oh-ih)/2:black`,
            );

            // Adjustments
            filters.push(`eq=brightness=${brightness}:contrast=${contrast}`);

            // Crop
            if (crop) {
                filters.push(`crop=${crop.width}:${crop.height}:${crop.x}:${crop.y}`);
            }

            // Rotate
            if (rotate !== 0) {
                filters.push(`rotate=${rotateRad}:c=black@0`);
            }

            // Blur
            if (blur > 0) {
                filters.push(`boxblur=${blur}`);
            }

            // Ken Burns effect
            if (kenBurns && !isGif) {
                let zoomFilter = '';
                switch (kenBurnsDirection) {
                    case 'leftToRight':
                        zoomFilter = `zoompan=z='min(zoom+0.0003,1.04)':x='iw/2-(iw/2)*zoom+(zoom-1)*8':y='ih/2-(ih/2)*zoom':d=500`;
                        break;
                    case 'rightToLeft':
                        zoomFilter = `zoompan=z='min(zoom+0.0003,1.04)':x='iw/2-(iw/2)*zoom-(zoom-1)*8':y='ih/2-(ih/2)*zoom':d=500`;
                        break;
                    case 'topToBottom':
                        zoomFilter = `zoompan=z='min(zoom+0.0003,1.04)':x='iw/2-(iw/2)*zoom':y='ih/2-(ih/2)*zoom+(zoom-1)*8':d=500`;
                        break;
                    case 'bottomToTop':
                        zoomFilter = `zoompan=z='min(zoom+0.0003,1.04)':x='iw/2-(iw/2)*zoom':y='ih/2-(ih/2)*zoom-(zoom-1)*8':d=500`;
                        break;
                }
                filters.push(zoomFilter);
            }

            // Fade
            if (fade) {
                filters.push(`fade=t=in:st=0:d=1`);
                filters.push(`fade=t=out:st=${audioDuration - 1}:d=1`);
            }

            // Subtitle
            filters.push(generateDrawTextFilter(subtitle, resolution.width, resolution.height));

            // Combine all filters and label [v]
            const filterComplex = `[0:v]${filters.join(',')}[v]`;

            // const ffmpegCommand = ffmpeg().input(inputImage).inputOptions(['-loop', '1']);

            const ffmpegCommand = ffmpeg().input(inputImage);

            if (isGif) {
                ffmpegCommand.inputOptions(['-ignore_loop', '0']);
            } else {
                ffmpegCommand.inputOptions(['-loop', '1']);
            }

            if (audioPath) {
                ffmpegCommand.input(audioPath);
                ffmpegCommand
                    .complexFilter(filterComplex, ['v'])
                    .outputOptions([
                        '-map',
                        '1:a', // Map audio from second input (index 1)
                        '-t',
                        audioDuration.toString(), // Set duration to match audio
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
            } else {
                ffmpegCommand
                    .complexFilter(filterComplex, ['v'])
                    .outputOptions([
                        '-t',
                        audioDuration.toString(),
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
            }
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

        //Delete audio files
        this.images.forEach((image) => {
            if (image.audioPath && fs.existsSync(image.audioPath)) {
                fs.unlinkSync(image.audioPath);
                console.log(`✔ Deleted: ${image.audioPath}`);
            }
        });

        if (this.config.backgroundMusic && fs.existsSync(this.config.backgroundMusic))
            fs.unlinkSync(this.config.backgroundMusic);

        //Delete image files
        this.images.forEach((image) => {
            if (fs.existsSync(image.path)) {
                fs.unlinkSync(image.path);
                console.log(`✔ Deleted: ${image.path}`);
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
    public async generate(): Promise<{
        success: boolean;
        outputPath?: string;
        outputWithMusicPath?: string;
        error?: any;
    }> {
        try {
            // Initialize and get image list
            this.initialize();

            // Process each image
            for (let i = 0; i < this.images.length; i++) {
                await this.createVideoFromImage(this.images[i], i, this.images[i].effects);
            }

            // Create final video
            await this.createFinalVideo();
            // Add background music if provided
            if (this.config.backgroundMusic) {
                await this.addMusicToVideo(
                    this.config.finalOutputPath,
                    this.config.backgroundMusic,
                    this.config.backgroundMusicVolume?.toString() || '0.3',
                    this.config.finalWithMusicPath,
                );
            }
            // Cleanup
            this.cleanUpTempFiles();

            const result = {
                success: true,
                outputPath: this.config.finalOutputPath,
                outputWithMusicPath: this.config.backgroundMusic
                    ? this.config.finalWithMusicPath
                    : 'No background music',
            };
            console.log('🎉 Video generation complete!', result);
            return result;
        } catch (error) {
            console.error('❌ Error during video generation:', error);
            return { success: false, error };
        }
    }

    public async addMusicToVideo(inputVideo: string, musicPath: string, volume: string, output: string): Promise<void> {
        return new Promise((resolve, reject) => {
            ffmpeg()
                .input(inputVideo)
                .input(musicPath)
                .complexFilter([
                    '[0:a]volume=1.0[a0]',
                    `[1:a]volume=${volume}[a1]`,
                    '[a0][a1]amix=inputs=2:duration=longest:dropout_transition=2[a]',
                ])
                .outputOptions([
                    '-map',
                    '0:v', // giữ video gốc
                    '-map',
                    '[a]', // mix audio
                    '-c:v',
                    'copy', // không encode lại video
                    '-c:a',
                    'aac',
                    '-b:a',
                    '192k',
                    '-shortest',
                ])
                .on('start', (cmd: any) => {
                    console.log('🔧 FFmpeg command:', cmd);
                })
                .on('end', () => {
                    console.log('✅ Video with mixed audio saved to:', output);
                    resolve();
                })
                .on('error', (err: any) => {
                    console.error('❌ FFmpeg error:', err);
                    reject(err);
                })
                .save(output);
        });
    }
}

function generateDrawTextFilter(subtitle: any, resolutionWidth: any, resolutionHeight: any) {
    // 1. Calculate font size based on video height
    const fontsize = Math.floor(resolutionHeight * 0.04);

    // 2. Calculate max characters per line based on width
    const maxLineLength = Math.floor(resolutionWidth / fontsize);

    // 3. Wrap subtitle
    const wrappedText = wrapSubtitle(subtitle, maxLineLength);

    // 4. Escape special characters
    const escapedText = wrappedText
        .replace(/\\/g, '\\\\') // Escape backslashes
        .replace(/'/g, '`') // Escape single quotes
        .replace(/:/g, '\\:') // Escape colons
        .replace(/\[/g, '\\[') // Escape square brackets
        .replace(/\]/g, '\\]') // Escape square brackets
        .replace(/\{/g, '\\{') // Escape curly braces
        .replace(/\}/g, '\\}') // Escape curly braces
        .replace(/\(/g, '\\(') // Escape parentheses
        .replace(/\)/g, '\\)') // Escape parentheses
        .replace(/%/g, '\\%'); // Escape percent signs

    // 5. Return the drawtext filter WITHOUT line_spacing parameter
    // Some FFmpeg versions don't support line_spacing in drawtext
    return `drawtext=text='${escapedText}':fontcolor=white:fontsize=${fontsize}:x=(w-text_w)/2:y=(h-text_h)/1.05:box=1:boxcolor=black@0.5:boxborderw=10`;
}

function wrapSubtitle(subtitle: string, maxLineLength: number): string {
    // Helper: center a line by padding space in front (works best with monospace fonts)
    function centerLine(line: string, maxLineLength: number): string {
        const padding = Math.floor((maxLineLength - line.length) / 2);
        return ' '.repeat(Math.max(0, padding)) + line;
    }

    const words = subtitle.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
        if ((currentLine + word).length > maxLineLength) {
            lines.push(centerLine(currentLine.trim(), maxLineLength));
            currentLine = word + ' ';
        } else {
            currentLine += word + ' ';
        }
    }

    if (currentLine.trim()) {
        lines.push(centerLine(currentLine.trim(), maxLineLength));
    }

    return lines.join('\n');
}


const user_config: Partial<SlideshowConfig> = {
    images: [
        {
            path: 'images/i1.jpg',
            audioPath: 'audios/audio1.mp3',
            subtitle:
                'Hoàng hôn buông xuống, lòng người nhẹ tênh long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long',
            effects: {
                brightness: 0,
                contrast: 1,
                resolution: { width: 1800, height: 900 },
                fade: true,
                kenBurns: true,
                kenBurnsDirection: 'bottomToTop',
                rotate: 180, // degrees
                blur: 0,
            },
        },
        {
            path: 'images/i2.jpg',
            audioPath: 'audios/audio1.mp3',
            subtitle: 'Bình minh lên, ánh sáng rực rỡ',
            // effects: {
            //   brightness: 0,
            //   contrast: 1,
            //   resolution: { width: 1800, height: 1000 },
            //   fade: true,
            //   kenBurns: false,
            //   kenBurnsDirection: "leftToRight",
            //   // crop: { width: 800, height: 600, x: 100, y: 50 },
            //   // rotate: 5, // degrees
            //   blur: 1,
            // },
        },
        {
            path: 'images/i3.jpg',
        },
    ],
    resolution: {
        width: 1920,
        height: 1080,
    },
    videoDuration: 5, // Duration per image (seconds)
    backgroundMusic: 'audios/background.mp3',
    backgroundMusicVolume: 0.3, // Volume level for background music (0.0 to 1.0)
};

export default SlideshowGenerator;
////////New config
// {
//     "config":
//     {
//             "images": [
//               {
//                 "path": "C:/Users/qthan/OneDrive/Desktop/TKPM_new/TKPM_Project/server/src/services/VideoService/images/i1.jpg",
//                 "audioPath": "C:/Users/qthan/OneDrive/Desktop/TKPM_new/TKPM_Project/server/src/services/VideoService/audios/audio1.mp3",
//                 "subtitle": "Hoàng hôn buông xuống, lòng người nhẹ tênh long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long",
//                 "effects": {
//                   "brightness": 0,
//                   "contrast": 1,
//                   "resolution": {
//                     "width": 1800,
//                     "height": 900
//                   },
//                   "fade": true,
//                   "kenBurns": true,
//                   "kenBurnsDirection": "bottomToTop",
//                   "rotate": 180,
//                   "blur": 0
//                 }
//               },
//               {
//                 "path": "C:/Users/qthan/OneDrive/Desktop/TKPM_new/TKPM_Project/server/src/services/VideoService/images/i2.jpg",
//                 "audioPath": "C:/Users/qthan/OneDrive/Desktop/TKPM_new/TKPM_Project/server/src/services/VideoService/audios/audio1.mp3",
//                 "subtitle": "Bình minh lên, ánh sáng rực rỡ"
//               },
//               {
//                 "path": "C:/Users/qthan/OneDrive/Desktop/TKPM_new/TKPM_Project/server/src/services/VideoService/images/i3.jpg"
//               }
//             ],
//             "resolution": {
//               "width": 1920,
//               "height": 1080
//             },
//             "videoDuration": 5,
//             "backgroundMusic": "C:/Users/qthan/OneDrive/Desktop/TKPM_new/TKPM_Project/server/src/services/VideoService/audios/background.mp3",
//             "backgroundMusicVolume": 0.3,
//             "cleanupTemp": false
//           }

// }
