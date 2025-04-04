import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface SlideshowConfig {
  imageDuration?: number;
  transitionDuration?: number;
  transitionEffect?: string;
  resolution?: string;
  outputFormat?: string;
  backgroundColor?: string;
  backgroundAudioPath?: string;
  title?: string;
  subtitle?: string;
  imagesPaths: string[];
  audioPaths?: string[];
  outputDir: string;
  finalOutputPath: string;
  finalWithHardSubsPath?: string;
}

interface GenerateResult {
  success: boolean;
  totalDuration?: number;
  hardSubsPath?: string;
  error?: any;
}

class SlideshowGenerator {
  private config: SlideshowConfig;

  constructor(config: SlideshowConfig) {
    this.config = {
      imageDuration: 5,
      transitionDuration: 1,
      transitionEffect: 'fade',
      resolution: '1920x1080',
      outputFormat: 'mp4',
      backgroundColor: '#000000',
      ...config
    };
    
    // Đảm bảo thư mục đầu ra tồn tại
    fs.mkdirSync(this.config.outputDir, { recursive: true });
    
    // Lưu metadata cho sử dụng sau này
    this.saveMetadata();
  }

  /**
   * Lưu metadata của slideshow
   */
  private saveMetadata(): void {
    try {
      const metadataPath = path.join(path.dirname(this.config.finalOutputPath), 'metadata.json');
      
      // Lọc dữ liệu để chỉ lưu thông tin cần thiết
      const metadata = {
        imageDuration: this.config.imageDuration,
        transitionDuration: this.config.transitionDuration,
        transitionEffect: this.config.transitionEffect,
        resolution: this.config.resolution,
        title: this.config.title,
        subtitle: this.config.subtitle,
        imageCount: this.config.imagesPaths.length,
        hasAudio: !!this.config.audioPaths?.length,
        hasBackgroundAudio: !!this.config.backgroundAudioPath,
        createdAt: new Date().toISOString()
      };
      
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    } catch (error) {
      console.error('Error saving metadata:', error);
    }
  }

  /**
   * Tạo slideshow từ các hình ảnh và âm thanh đã tải lên
   * @returns Kết quả tạo slideshow
   */
  async generate(): Promise<GenerateResult> {
    try {
      // Đây là nơi bạn sẽ thực hiện tạo slideshow bằng FFmpeg hoặc công cụ khác
      // Đây là một ví dụ đơn giản sử dụng FFmpeg để tạo slideshow từ hình ảnh
      
      if (this.config.imagesPaths.length === 0) {
        throw new Error('No images provided');
      }

      // Chuẩn bị tham số FFmpeg
      const ffmpegParams = this.prepareFfmpegParams();
      
      // Thực hiện lệnh FFmpeg
      await execAsync(ffmpegParams);
      
      // Tạo phiên bản với phụ đề cứng nếu cần
      let hardSubsPath: string | undefined = undefined;
      if (this.config.title || this.config.subtitle) {
        hardSubsPath = this.config.finalWithHardSubsPath;
        await this.addHardSubtitles();
      }
      
      // Tính toán tổng thời lượng dựa trên số lượng hình ảnh và cấu hình
      const totalImages = this.config.imagesPaths.length;
      const totalDuration = totalImages * (this.config.imageDuration || 5) + 
                          (totalImages - 1) * (this.config.transitionDuration || 1);
      
      return {
        success: true,
        totalDuration,
        hardSubsPath
      };
    } catch (error) {
      console.error('Error generating slideshow:', error);
      return {
        success: false,
        error
      };
    }
  }

  /**
   * Chuẩn bị tham số cho lệnh FFmpeg
   * @returns Chuỗi lệnh FFmpeg
   */
  private prepareFfmpegParams(): string {
    // Đây là một ví dụ đơn giản, bạn cần mở rộng theo nhu cầu thực tế
    
    // Xác định kích thước từ chuỗi resolution
    const [width, height] = (this.config.resolution || '1920x1080').split('x');
    
    // Tạo danh sách tham số đầu vào cho hình ảnh
    const imageInputs = this.config.imagesPaths.map(imgPath => `-i "${imgPath}"`).join(' ');
    
    // Tạo filter complex cho hình ảnh và chuyển tiếp
    let filterComplex = '';
    for (let i = 0; i < this.config.imagesPaths.length; i++) {
      // Scale và pad hình ảnh để khớp với resolution
      filterComplex += `[${i}:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1[v${i}];`;
    }
    
    // Thêm chuyển tiếp giữa các hình ảnh
    for (let i = 0; i < this.config.imagesPaths.length - 1; i++) {
      const nextIndex = i + 1;
      const duration = this.config.imageDuration || 5;
      const transDuration = this.config.transitionDuration || 1;
      
      // Tạo hiệu ứng chuyển tiếp dựa trên cấu hình
      let transitionFilter;
      switch(this.config.transitionEffect) {
        case 'slideLeft':
          transitionFilter = `xfade=transition=slideleft:duration=${transDuration}:offset=${duration}`;
          break;
        case 'slideRight':
          transitionFilter = `xfade=transition=slideright:duration=${transDuration}:offset=${duration}`;
          break;
        case 'zoomIn':
          transitionFilter = `xfade=transition=fadeblack:duration=${transDuration}:offset=${duration}`;
          break;
        case 'zoomOut':
          transitionFilter = `xfade=transition=fadeblack:duration=${transDuration}:offset=${duration}`;
          break;
        default:
          transitionFilter = `xfade=transition=fade:duration=${transDuration}:offset=${duration}`;
      }
      
      if (i === 0) {
        filterComplex += `[v${i}][v${nextIndex}]${transitionFilter}[v${nextIndex}out];`;
      } else if (i < this.config.imagesPaths.length - 2) {
        filterComplex += `[v${i}out][v${nextIndex}]${transitionFilter}[v${nextIndex}out];`;
      } else {
        filterComplex += `[v${i}out][v${nextIndex}]${transitionFilter}[vout]`;
      }
    }
    
    // Xử lý âm thanh nếu có
    let audioParams = '';
    if (this.config.backgroundAudioPath) {
      audioParams = `-i "${this.config.backgroundAudioPath}" -shortest -c:a aac -b:a 192k`;
    } else if (this.config.audioPaths && this.config.audioPaths.length > 0) {
      // Kết hợp nhiều file âm thanh thành một
      const audioInputs = this.config.audioPaths.map(audioPath => `-i "${audioPath}"`).join(' ');
      audioParams = `${audioInputs} -filter_complex "concat=n=${this.config.audioPaths.length}:v=0:a=1[aout]" -map "[aout]" -c:a aac -b:a 192k`;
    } else {
      // Không có âm thanh
      audioParams = '-an';
    }
    
    // Tạo lệnh FFmpeg hoàn chỉnh
    return `ffmpeg ${imageInputs} ${audioParams} -filter_complex "${filterComplex}" -map "[vout]" -c:v libx264 -preset medium -crf 23 "${this.config.finalOutputPath}"`;
  }

  /**
   * Thêm phụ đề cứng vào video
   */
  private async addHardSubtitles(): Promise<void> {
    try {
      if (!this.config.finalWithHardSubsPath) return;
      
      let drawTextFilters = '';
      
      // Thêm tiêu đề nếu có
      if (this.config.title) {
        drawTextFilters += `drawtext=text='${this.config.title}':fontcolor=white:fontsize=36:x=(w-text_w)/2:y=h*0.1:shadowcolor=black:shadowx=2:shadowy=2`;
      }
      
      // Thêm phụ đề nếu có
      if (this.config.subtitle) {
        if (drawTextFilters) drawTextFilters += ',';
        drawTextFilters += `drawtext=text='${this.config.subtitle}':fontcolor=white:fontsize=24:x=(w-text_w)/2:y=h*0.9:shadowcolor=black:shadowx=2:shadowy=2`;
      }
      
      if (!drawTextFilters) return;
      
      // Thực hiện lệnh FFmpeg để thêm phụ đề cứng
      const command = `ffmpeg -i "${this.config.finalOutputPath}" -vf "${drawTextFilters}" -c:a copy "${this.config.finalWithHardSubsPath}"`;
      await execAsync(command);
    } catch (error) {
      console.error('Error adding hard subtitles:', error);
      throw error;
    }
  }
}

export default SlideshowGenerator;