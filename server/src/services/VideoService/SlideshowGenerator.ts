// import * as fs from "fs";
// import * as path from "path";
// import ffmpegStatic from "ffmpeg-static";
const fs = require('fs');
const path = require('path');
const ffmpegStatic = require('ffmpeg-static');
const ffmpeg = require('fluent-ffmpeg');

// Set ffmpeg path
if (ffmpegStatic) {
    ffmpeg.setFfmpegPath(ffmpegStatic);
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

interface Subtitle {
    startTime: string;
    endTime: string;
    text: string;
}

interface ImageInfo {
    path: string;
    duration?: number;
    speed?: number;
    title?: string;
    audioPath?: string;
    audioVolume?: number;
    subtitle?: string;
    subtitles?: string[];
    effects?: Effects;
}

interface SegmentDuration {
    index: number;
    startTime: number;
    duration: number;
    originalDuration: number;
    speed: number;
}

interface SlideshowConfig {
    imagesDir: string;
    outputDir: string;
    finalOutputPath: string;
    finalWithHardSubsPath: string;
    videoDuration: number;
    resolution: Resolution;
    frameRate: number;
    videoBitrate: string;
    audioPath: string | string[];
    audioVolume: number;
    audioBitrate: string;
    defaultEffects: Effects;
    addHardSubtitles: boolean;
    cleanupTemp: boolean;
    videoCodec: string;
    audioCodec: string;
    pixelFormat: string;
    useBackgroundMusic?: boolean;
    images?: ImageInfo[];
    subtitles?: Subtitle[];
    hasImageAudio?: boolean;
    musicPath?: string;
}

// Default configuration
const defaultConfig: SlideshowConfig = {
    // Directories and paths
    imagesDir: path.join(__dirname, 'images'),
    outputDir: path.join(__dirname, 'tmp_videos'),
    finalOutputPath: path.join(__dirname, 'final_output.mp4'),
    finalWithHardSubsPath: path.join(__dirname, 'final_with_hardsubs.mp4'),

    // Video configuration
    videoDuration: 5, // Duration per image (seconds)
    resolution: { width: 1920, height: 1080 },
    frameRate: 30,
    videoBitrate: '4M',

    // Audio configuration
    audioPath: path.join(__dirname, 'background.mp3'),
    audioVolume: 1.0,
    audioBitrate: '192k',

    // Default effects
    defaultEffects: {
        fade: true,
        fadeInDuration: 1,
        fadeOutDuration: 1,
        zoomDirection: 'none',
        zoomAmount: 1.1,
        panDirection: 'none',
        panAmount: 0.1,
    },

    // Subtitles
    addHardSubtitles: true,

    // Advanced options
    cleanupTemp: true,
    videoCodec: 'libx264',
    audioCodec: 'aac',
    pixelFormat: 'yuv420p',
};

// Main class for slideshow generation
class SlideshowGenerator {
    private config: SlideshowConfig;
    private videoFiles: string[] = [];
    private images: ImageInfo[] = [];
    private segmentDurations: SegmentDuration[] = [];
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
        return new Promise(async (resolve, reject) => {
            const inputImage = typeof imageInfo === 'string' ? imageInfo : imageInfo.path;
            const imgInfo = typeof imageInfo === 'string' ? { path: inputImage } : imageInfo;
            const duration = imgInfo.duration || this.config.videoDuration;
            const speed = imgInfo.speed || 1.0;
            const adjustedDuration = duration / speed;
            const outputVideo = path.join(this.config.outputDir, `video_${index}.mp4`);
            // Create a temporary video file without audio
            const tempVideoFile = path.join(this.config.outputDir, `temp_video_${index}.mp4`);

            // Save information about this segment for subtitle calculation
            this.segmentDurations.push({
                index,
                startTime: this.totalDuration,
                duration: adjustedDuration,
                originalDuration: duration,
                speed,
            });

            this.totalDuration += adjustedDuration;
            this.videoFiles.push(outputVideo);

            console.log(`🔄 [${index + 1}/${this.images.length}] Processing: ${inputImage}`);

            // Effects
            const effects = imgInfo.effects || this.config.defaultEffects;
            const filterChain: string[] = [];

            // Step 1: Scale image with preserved aspect ratio
            filterChain.push(
                `[0:v]scale=${this.config.resolution.width}:${this.config.resolution.height}:force_original_aspect_ratio=decrease`,
            );
            filterChain.push(
                `pad=${this.config.resolution.width}:${this.config.resolution.height}:(ow-iw)/2:(oh-ih)/2:black`,
            );

            // Step 2: Zoom + Pan (Ken Burns effect)
            if (effects.zoomDirection !== 'none' || effects.panDirection !== 'none') {
                let zoomStart = 1,
                    zoomEnd = 1,
                    xStart = 0,
                    yStart = 0,
                    xEnd = 0,
                    yEnd = 0;
                const zoomAmount = effects.zoomAmount || 1.1;
                const panAmount = effects.panAmount || 0.1;

                if (effects.zoomDirection === 'in') {
                    zoomEnd = zoomAmount;
                } else if (effects.zoomDirection === 'out') {
                    zoomStart = zoomAmount;
                }

                switch (effects.panDirection) {
                    case 'left':
                        xStart = panAmount;
                        break;
                    case 'right':
                        xEnd = panAmount;
                        break;
                    case 'up':
                        yStart = panAmount;
                        break;
                    case 'down':
                        yEnd = panAmount;
                        break;
                }

                filterChain.push(
                    `zoompan=z='if(lte(in,1),${zoomStart},min(zoom+0.002,${zoomEnd}))':` +
                        `x='iw*${xStart}+(iw*${xEnd}-iw*${xStart})*in/duration':` +
                        `y='ih*${yStart}+(ih*${yEnd}-ih*${yStart})*in/duration':` +
                        `d=${Math.round(adjustedDuration * this.config.frameRate)}:fps=${this.config.frameRate}`,
                );
            }

            // Step 3: Add fade in/out if enabled
            if (effects.fade) {
                const fadeInDuration = effects.fadeInDuration || 1;
                const fadeOutDuration = effects.fadeOutDuration || 1;
                filterChain.push(
                    `fade=t=in:st=0:d=${fadeInDuration},fade=t=out:st=${
                        adjustedDuration - fadeOutDuration
                    }:d=${fadeOutDuration}`,
                );
            }

            // Combine filters into a valid chain
            const filterComplex = `${filterChain.join(',')}[out]`;
            console.log('🔄 Processing video with effects:', filterComplex);

            try {
                // STEP 1: Create video without audio
                await new Promise<void>((resolveVideo, rejectVideo) => {
                    ffmpeg()
                        .input(inputImage)
                        .inputOptions(['-loop', '1'])
                        .complexFilter(filterComplex, ['out'])
                        .outputOptions([
                            `-c:v ${this.config.videoCodec}`,
                            `-t ${adjustedDuration}`,
                            `-r ${this.config.frameRate}`,
                            `-pix_fmt ${this.config.pixelFormat}`,
                            `-b:v ${this.config.videoBitrate}`,
                            '-an', // No audio
                        ])
                        .on('end', () => {
                            console.log(`✅ Video ${index + 1} created without audio`);
                            resolveVideo();
                        })
                        .on('error', (err: any) => {
                            console.error(`❌ Error creating video ${index + 1}:`, err);
                            rejectVideo(err);
                        })
                        .on('start', (cmdLine: any) => {
                            console.log('🎬 FFmpeg video command:', cmdLine);
                        })
                        .save(tempVideoFile);
                });

                // STEP 2: Add audio if available
                const hasCustomAudio = imgInfo.audioPath && fs.existsSync(imgInfo.audioPath);

                if (hasCustomAudio && imgInfo.audioPath) {
                    const audioVolume = imgInfo.audioVolume || this.config.audioVolume || 1.0;
                    console.log(`🔊 Adding audio to video ${index + 1} from: ${imgInfo.audioPath}`);

                    await new Promise<void>((resolveAudio, rejectAudio) => {
                        ffmpeg()
                            .input(tempVideoFile)
                            .input(imgInfo.audioPath)
                            .outputOptions([
                                `-c:v copy`,
                                `-c:a ${this.config.audioCodec}`,
                                `-b:a ${this.config.audioBitrate}`,
                                `-af volume=${audioVolume}`,
                                `-shortest`,
                            ])
                            .on('end', () => {
                                console.log(`✅ Audio added to video ${index + 1}`);
                                // Delete temp file
                                if (fs.existsSync(tempVideoFile)) {
                                    fs.unlinkSync(tempVideoFile);
                                }
                                resolveAudio();
                            })
                            .on('error', (err: any) => {
                                console.error(`❌ Error adding audio to video ${index + 1}:`, err);
                                rejectAudio(err);
                            })
                            .on('start', (cmdLine: any) => {
                                console.log('🎬 FFmpeg audio command:', cmdLine);
                            })
                            .save(outputVideo);
                    });
                } else {
                    // No audio to add, just rename the temp file
                    fs.renameSync(tempVideoFile, outputVideo);
                }

                console.log(`✅ Video ${index + 1} completed`);
                resolve();
            } catch (error) {
                console.error(`❌ Error processing image ${index + 1}:`, error);
                reject(error);
            }
        });
    }

    // Convert time to SRT format (HH:MM:SS,MMM)
    private formatSrtTime(seconds: number): string {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        const milliseconds = Math.floor((seconds % 1) * 1000);

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs
            .toString()
            .padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`;
    }

    // Create subtitle file based on actual duration of each segment
    private createSubtitleFile(): string {
        const subtitlePath = path.join(__dirname, 'subtitles.srt');
        console.log('📝 Creating subtitle file:', subtitlePath);
        let subtitleEntries: string[] = [];
        let entryIndex = 1;

        // Check which subtitle method is used
        const hasMultipleSubtitles = this.images.some((img) => img.subtitles && Array.isArray(img.subtitles));
        const hasSingleSubtitles = this.images.some((img) => img.subtitle && !img.subtitles);

        if (hasMultipleSubtitles) {
            // Process multiple subtitles for each segment
            this.segmentDurations.forEach((segment) => {
                const imageInfo = this.images[segment.index];

                if (imageInfo.subtitles && Array.isArray(imageInfo.subtitles)) {
                    const subtitles = imageInfo.subtitles;
                    const segmentDuration = segment.duration;

                    // Calculate time for each subtitle
                    const timePerSubtitle = segmentDuration / subtitles.length;

                    subtitles.forEach((subtitleText, subIndex) => {
                        const startOffset = timePerSubtitle * subIndex;
                        const endOffset = timePerSubtitle * (subIndex + 1);

                        const startTime = this.formatSrtTime(segment.startTime + startOffset);
                        const endTime = this.formatSrtTime(segment.startTime + endOffset);

                        subtitleEntries.push(`
${entryIndex}
${startTime} --> ${endTime}
${subtitleText}`);
                        entryIndex++;
                    });
                }
            });
        } else if (hasSingleSubtitles) {
            // Process a single subtitle for each segment
            this.segmentDurations.forEach((segment) => {
                const imageInfo = this.images[segment.index];
                if (imageInfo.subtitle) {
                    const startTime = this.formatSrtTime(segment.startTime);
                    const endTime = this.formatSrtTime(segment.startTime + segment.duration);

                    subtitleEntries.push(`
${entryIndex}
${startTime} --> ${endTime}
${imageInfo.subtitle}`);
                    entryIndex++;
                }
            });
        } else if (this.config.subtitles && Array.isArray(this.config.subtitles)) {
            // Use predefined subtitles with fixed times
            subtitleEntries = this.config.subtitles.map((subtitle, index) => {
                return `
${index + 1}
${subtitle.startTime} --> ${subtitle.endTime}
${subtitle.text}`;
            });
        } else {
            // If no subtitles, create default subtitles for each segment
            this.segmentDurations.forEach((segment) => {
                const imageInfo = this.images[segment.index];
                const startTime = this.formatSrtTime(segment.startTime);
                const endTime = this.formatSrtTime(segment.startTime + segment.duration);
                const title = imageInfo.title || `Slide ${segment.index + 1}`;

                subtitleEntries.push(`
${entryIndex}
${startTime} --> ${endTime}
${title}`);
                entryIndex++;
            });
        }

        fs.writeFileSync(subtitlePath, subtitleEntries.join('\n').trim());
        console.log(`📝 Created subtitle file: ${subtitlePath}`);
        return subtitlePath;
    }

    // Add hard subtitles to video
    private async addHardSubtitles(): Promise<void> {
        return new Promise((resolve, reject) => {
            const subtitleFile = this.createSubtitleFile();
            console.log("Current path:", path.join(__dirname));
            console.log("Current relative path:", path.relative(__dirname, subtitleFile));
            console.log("Current absolute path:", path.resolve(subtitleFile));
            console.log('🎬 Adding hard subtitles to video...');
            
            // Fix: Properly escape the subtitle path for FFmpeg
            const escapedPath = subtitleFile.replace(/\\/g, '/').replace(/:/g, '\\\\:');
            
            ffmpeg()
                .input(this.config.finalOutputPath)
                .inputOptions('-y')
                .videoFilters([
                    `subtitles=${escapedPath}:force_style='Fontsize=24,PrimaryColour=&HFFFFFF&,BackColour=&H80000000&,BorderStyle=1,Outline=1,Shadow=0'`,
                ])
                .outputOptions([`-c:v ${this.config.videoCodec}`, '-c:a copy'])
                .on('end', () => {
                    console.log('✅ Video with hard subtitles completed!');
                    resolve();
                })
                .on('error', (err: any, stdout: any, stderr: any) => {
                    console.error('❌ Error adding hard subtitles:', err);
                    console.error('FFmpeg stderr:', stderr);
                    reject(err);
                })
                .on('start', (cmdLine: any) => {
                    console.log('🎬 FFmpeg command for hard subtitles:', cmdLine);
                })
                .save(this.config.finalWithHardSubsPath);
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

        //Delete subtitle file
        const subtitlePath = path.join(__dirname, 'subtitles.srt');
        if (fs.existsSync(subtitlePath)) {
            fs.unlinkSync(subtitlePath);
            console.log(`✔ Deleted: ${subtitlePath}`);
        }
        // Delete temporary video directory
        if (fs.existsSync(this.config.outputDir)) {
            fs.rmdirSync(this.config.outputDir, { recursive: true });
            console.log(`✔ Deleted directory: ${this.config.outputDir}`);
        }

        console.log('🚀 Cleanup complete!');
    }

    // Create final video from individual segments
// Create final video from individual segments
private async createFinalVideo(): Promise<void> {
    // Create file list for concat
    const fileListPath = path.join(this.config.outputDir, 'file_list.txt');
    fs.writeFileSync(
        fileListPath,
        this.videoFiles.map((v) => `file '${v.replace(/\\/g, '/')}'`).join('\n')
    );

    return new Promise((resolve, reject) => {
        console.log('🔄 Concatenating videos...');
        console.log('Audio path(s):', this.config.audioPath);

        const ffmpegCommand = ffmpeg()
            .input(fileListPath)
            .inputOptions(['-f', 'concat', '-safe', '0']);

        const useBackgroundMusic = this.config.useBackgroundMusic;

        const filters: string[] = [];

        if (useBackgroundMusic) {
            console.log('🔊 Adding background music:', this.config.audioPath);
            ffmpegCommand.input(this.config.audioPath);

            if (this.config.hasImageAudio) {
                // Trộn âm thanh gốc của video + background music
                filters.push(`[0:a]volume=1.0[a0]`);
                filters.push(`[1:a]volume=${this.config.audioVolume || 0.3}[a1]`);
                filters.push(`[a0][a1]amix=inputs=2:duration=longest[aout]`);
            } else {
                // Chỉ dùng nhạc nền
                filters.push(`[1:a]volume=${this.config.audioVolume || 0.3}[aout]`);
            }

            ffmpegCommand.complexFilter(filters);

            ffmpegCommand.outputOptions([
                '-map 0:v',
                '-map [aout]',
                '-c:v copy',
                `-c:a ${this.config.audioCodec || 'aac'}`,
                `-b:a ${this.config.audioBitrate || '192k'}`,
                '-shortest',
            ]);
        } else {
            // Giữ nguyên âm thanh gốc (nếu có)
            ffmpegCommand.outputOptions([
                '-c:v copy',
                '-c:a copy',
                '-map 0:v',
                '-map 0:a?',
                '-shortest',
            ]);
        }

        ffmpegCommand
            .on('progress', (progress: any) => {
                if (progress.percent) {
                    console.log(`⏳ Progress: ${Math.round(progress.percent)}%`);
                }
            })
            .on('end', () => {
                console.log('✅ Final video completed!');
                resolve();
            })
            .on('error', (err: any, stdout: any, stderr: any) => {
                console.error('❌ Error concatenating videos:', err);
                console.error('FFmpeg stderr:', stderr);
                reject(err);
            })
            .on('start', (cmdLine: any) => {
                console.log('🎬 FFmpeg command for concatenation:', cmdLine);
            })
            .save(this.config.finalOutputPath);
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

            // Add subtitles (optional)
            if (this.config.addHardSubtitles) {
                await this.addHardSubtitles();
            }

            // Cleanup
            this.cleanUpTempFiles();
            const result = {
                success: true,
                outputPath: this.config.finalOutputPath,
                hardSubsPath: this.config.addHardSubtitles ? this.config.finalWithHardSubsPath : null,
                totalDuration: this.totalDuration,
            };
            console.log('🎉 Video generation complete!', result);
            return result;
        } catch (error) {
            console.error('❌ Error during video generation:', error);
            return { success: false, error };
        }
    }
}

// Example usage
const customConfig: Partial<SlideshowConfig> = {
    // Use array of images with custom effects for each image
    images: [
        {
            path: 'https://scontent.fsgn5-14.fna.fbcdn.net/v/t39.30808-6/488928021_1200604601735519_5205783039337788296_n.jpg?stp=dst-jpg_s600x600_tt6&_nc_cat=101&ccb=1-7&_nc_sid=127cfc&_nc_ohc=vxlw8GUpgwgQ7kNvwE2gryU&_nc_oc=AdkKXedtrM1KIyW2mR8l1TlFilGGy9NmkclZ6hkHrlrKNGQHVk9IfP06CVewdmaxkLlZhvHYXhpRTD5JZUzSkLSL&_nc_pt=1&_nc_zt=23&_nc_ht=scontent.fsgn5-14.fna&_nc_gid=KHjFlmTxwVcpDRxpWwuciQ&oh=00_AYHciqqKU9kR7CjzyP9Az1IZguFPftiPp8rqzHpeFDpJNA&oe=67F5258A',
            duration: 5,
            speed: 1, // Normal speed
            audioPath: path.join(__dirname, 'audio/1.mp3'), // Custom audio for this segment
            audioVolume: 1, // Custom volume for this segment

            // Use array of subtitles instead of a single long subtitle
            subtitles: [
                'Part 1: Introduction to the topic',
                'Part 2: Key points to note',
                'Part 3: Conclusion and summary',
            ],

            // effects: {
            //   fade: true,
            //   fadeInDuration: 1.0,
            //   fadeOutDuration: 1.0,
            //   zoomDirection: "in", // Zoom in
            //   zoomAmount: 1.0, // 20% zoom
            //   panDirection: "left", // Pan left
            //   panAmount: 0.15, // 15% pan
            // },
        },
        {
            path: path.join(__dirname, 'images/2.jpg'),
            duration: 5,
            speed: 1.0, // Normal speed
            audioPath: path.join(__dirname, 'audio/2.mp3'), // Custom audio for this segment

            // Subtitles split into 2 parts
            subtitles: ['Step 1: Analyze data\nAnd process information', 'Step 2: Present results\nAnd report'],

            // effects: {
            //   fade: true,
            //   fadeInDuration: 1.5,
            //   fadeOutDuration: 1.5,
            //   zoomDirection: "out", // Zoom out
            //   zoomAmount: 1.15, // 15% zoom
            //   panDirection: "down", // Pan down
            //   panAmount: 0.1, // 10% pan
            // },
        },
        {
            path: path.join(__dirname, 'images/3.jpg'),
            duration: 6,
            speed: 0.8, // 20% slower
            audioPath: path.join(__dirname, 'audio/3.mp3'), // Custom audio for this segment
            audioVolume: 0.8, // Reduce volume by 20%

            // Array of subtitles with 3 parts
            subtitles: [
                'This is the first part of the subtitle\nCan include multiple lines',
                'Next is the second part\nAdditional information here',
                'Finally the ending part\nSummarizing the information',
            ],

            // effects: {
            //   fade: true,
            //   fadeInDuration: 2.0,
            //   fadeOutDuration: 2.0,
            //   zoomDirection: "none", // No zoom
            //   zoomAmount: 1,
            //   panDirection: "right", // Pan right
            //   panAmount: 0.2, // 20% pan
            // },
        },
    ],

    // General configuration
    videoDuration: 5, // Default for each image if not specified
    resolution: { width: 1920, height: 1080 },

    // Enable background music (since we have custom audio for each segment)
    useBackgroundMusic: true,
    audioPath: path.join(__dirname, 'audio/background.mp3'), // Common background music
    audioVolume: 1.0, // Default volume for background music

    // Default effects (will be applied if not specified individually)
    defaultEffects: {
        fade: true,
        fadeInDuration: 1.0,
        fadeOutDuration: 1.0,
        zoomDirection: 'none',
        zoomAmount: 1,
        panDirection: 'none',
        panAmount: 0,
    },

    hasImageAudio: true, // Enable audio for images

    // Other
    cleanupTemp: false,
};

// Run script
// const slideshow = new SlideshowGenerator(customConfig);
// Or run with default configuration
// const slideshow = new SlideshowGenerator();
// slideshow.generate();

// EXPORT CLASS FOR USE ELSEWHERE
export default SlideshowGenerator;



/////////Config for API///////////
// {
//     "config": {
//       "images": [
//         {
//           "path": "https://scontent.fsgn5-15.fna.fbcdn.net/v/t39.30808-6/488256833_1326497635503095_5803416923290182618_n.jpg?_nc_cat=1&ccb=1-7&_nc_sid=833d8c&_nc_ohc=NIlkiKn10mMQ7kNvwH8dD3Z&_nc_oc=Adns_VWKfN4xybwmblWjG-KAeWFPCf7A_Hxm4vIKwMIwRVYNAIU9D7TK2j-jIlIkJSBTPQuq5pLrBp952K8sXKLe&_nc_pt=1&_nc_zt=23&_nc_ht=scontent.fsgn5-15.fna&_nc_gid=kgCLVDdFq2ikRPL4o6FuLA&oh=00_AYEdCUk9FxBAAFZnWS9quIARv33LOOvAfg3talzuXC7zbA&oe=67F69FBA",
//           "duration": 5,
//           "speed": 1,
//           "audioPath": "audio/1.mp3",
//           "audioVolume": 1,
//           "subtitles": [
//             "Part 1: Introduction to the topic",
//             "Part 2: Key points to note"
//           ]
//         }
//       ],
//       "videoDuration": 5,
//       "resolution": {
//         "width": 1920,
//         "height": 1080
//       },
//       "useBackgroundMusic": true,
//       "audioPath":"C:/Users/qthan/OneDrive/Desktop/TKPM_new/TKPM_Project/server/src/services/VideoService/audio/background.mp3", 
//       "audioVolume": 1.0,
//       "defaultEffects": {
//         "fade": true,
//         "fadeInDuration": 1.0,
//         "fadeOutDuration": 1.0,
//         "zoomDirection": "none",
//         "zoomAmount": 1,
//         "panDirection": "none",
//         "panAmount": 0
//       },
//       "hasImageAudio": false,
//       "cleanupTemp": true
//     }
//   }
  