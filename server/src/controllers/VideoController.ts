import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import SlideshowGenerator from '../services/SlideshowGenerator';

class VideoController {
  private uploadsDir: string;
  private outputsDir: string;
  private upload: multer.Multer;

  constructor() {
    // Tạo các thư mục cần thiết
    this.uploadsDir = path.join(__dirname, '..', 'uploads');
    this.outputsDir = path.join(__dirname, '..', 'output');
    fs.mkdirSync(this.uploadsDir, { recursive: true });
    fs.mkdirSync(this.outputsDir, { recursive: true });

    // Cấu hình lưu trữ file
    const storage = multer.diskStorage({
      destination: (req: Request, file: Express.Multer.File, cb: Function) => {
        // Lưu trữ hình ảnh và file âm thanh vào thư mục thích hợp
        let destPath: string;
        if (file.fieldname === 'images') {
          destPath = path.join(this.uploadsDir, 'images');
        } else if (file.fieldname === 'audio' || file.fieldname === 'backgroundAudio') {
          destPath = path.join(this.uploadsDir, 'audio');
        } else {
          destPath = this.uploadsDir;
        }
        fs.mkdirSync(destPath, { recursive: true });
        cb(null, destPath);
      },
      filename: (req: Request, file: Express.Multer.File, cb: Function) => {
        cb(null, `${Date.now()}-${file.originalname}`);
      }
    });

    this.upload = multer({ storage });
  }

  /**
   * Middleware để xử lý upload file
   */
  handleUpload() {
    return this.upload.fields([
      { name: 'images', maxCount: 50 },
      { name: 'audio', maxCount: 10 },
      { name: 'backgroundAudio', maxCount: 1 }
    ]);
  }

  /**
   * Xử lý yêu cầu upload
   */
  uploadFiles = (req: Request, res: Response) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      const response: {
        images: { filename: string; originalName: string; path: string }[];
        audio: { filename: string; originalName: string; path: string }[];
        backgroundAudio: { filename: string; originalName: string; path: string } | null;
      } = {
        images: [],
        audio: [],
        backgroundAudio: null
      };

      // Xử lý hình ảnh đã tải lên
      if (files.images) {
        response.images = files.images.map(file => ({
          filename: file.filename,
          originalName: file.originalname,
          path: file.path
        }));
      }

      // Xử lý file âm thanh đã tải lên
      if (files.audio) {
        response.audio = files.audio.map(file => ({
          filename: file.filename,
          originalName: file.originalname,
          path: file.path
        }));
      }

      // Xử lý âm thanh nền
      if (files.backgroundAudio && files.backgroundAudio[0]) {
        response.backgroundAudio = {
          filename: files.backgroundAudio[0].filename,
          originalName: files.backgroundAudio[0].originalname,
          path: files.backgroundAudio[0].path
        };
      }

      res.status(200).json({
        success: true,
        files: response
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  };

  /**
   * Tạo slideshow từ cấu hình
   */
  generateSlideshow = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { config } = req.body;
      
      if (!config) {
        return res.status(400).json({
          success: false,
          error: 'No configuration provided'
        });
      }
      
      // Tạo thư mục đầu ra cho slideshow này
      const slideshowId = Date.now().toString();
      const outputDir = path.join(this.outputsDir, slideshowId);
      fs.mkdirSync(outputDir, { recursive: true });
      
      // Chuẩn bị cấu hình slideshow
      const slideshowConfig = {
        ...config,
        outputDir: path.join(outputDir, 'tmp'),
        finalOutputPath: path.join(outputDir, 'final_output.mp4'),
        finalWithHardSubsPath: path.join(outputDir, 'final_with_hardsubs.mp4')
      };
      
      // Tạo slideshow
      const slideshow = new SlideshowGenerator(slideshowConfig);
      const result = await slideshow.generate();
      
      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: 'Failed to generate slideshow',
          details: result.error
        });
      }
      
      // Tạo URL công khai
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const videoUrl = `${baseUrl}/api/videos/${slideshowId}`;
      const videoWithSubsUrl = result.hardSubsPath ? 
        `${baseUrl}/api/videos/${slideshowId}/with-subs` : null;
      
      res.status(200).json({
        success: true,
        id: slideshowId,
        videoUrl,
        videoWithSubsUrl,
        duration: result.totalDuration
      });
    } catch (error: any) {
      console.error('Generation error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Lấy video đã tạo
   */
  getVideo = (req: Request, res: Response, next: NextFunction) => {
    const videoPath = path.join(this.outputsDir, req.params.id, 'final_output.mp4');
    
    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({
        success: false,
        error: 'Video not found'
      });
    }
    
    res.sendFile(videoPath);
  };

  /**
   * Lấy video với phụ đề
   */
  getVideoWithSubs = (req: Request, res: Response, next: NextFunction) => {
    const videoPath = path.join(this.outputsDir, req.params.id, 'final_with_hardsubs.mp4');
    
    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({
        success: false,
        error: 'Video with subtitles not found'
      });
    }
    
    res.sendFile(videoPath);
  };

  /**
   * Xóa slideshow
   */
  deleteSlideshow = (req: Request, res: Response, next: NextFunction) => {
    const slideshowDir = path.join(this.outputsDir, req.params.id);
    
    if (!fs.existsSync(slideshowDir)) {
      return res.status(404).json({
        success: false,
        error: 'Slideshow not found'
      });
    }
    
    try {
      fs.rmSync(slideshowDir, { recursive: true, force: true });
      res.status(200).json({
        success: true,
        message: 'Slideshow deleted successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Lấy danh sách slideshow
   */
  listSlideshows = (req: Request, res: Response) => {
    try {
      const slideshows = fs.readdirSync(this.outputsDir)
        .filter(file => {
          const stats = fs.statSync(path.join(this.outputsDir, file));
          return stats.isDirectory();
        })
        .map(dir => {
          const slideshowPath = path.join(this.outputsDir, dir);
          const hasVideo = fs.existsSync(path.join(slideshowPath, 'final_output.mp4'));
          const hasSubtitles = fs.existsSync(path.join(slideshowPath, 'final_with_hardsubs.mp4'));
          
          // Thông tin cơ bản về slideshow
          return {
            id: dir,
            createdAt: new Date(parseInt(dir)).toISOString(),
            hasVideo,
            hasSubtitles
          };
        })
        .sort((a, b) => b.id.localeCompare(a.id)); // Sắp xếp mới nhất trước
      
      res.status(200).json({
        success: true,
        slideshows
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  /**
   * Lấy thông tin chi tiết slideshow
   */
  getSlideshowDetails = (req: Request, res: Response, next: NextFunction) => {
    const slideshowDir = path.join(this.outputsDir, req.params.id);
    
    if (!fs.existsSync(slideshowDir)) {
      return res.status(404).json({
        success: false,
        error: 'Slideshow not found'
      });
    }
    
    try {
      const hasVideo = fs.existsSync(path.join(slideshowDir, 'final_output.mp4'));
      const hasSubtitles = fs.existsSync(path.join(slideshowDir, 'final_with_hardsubs.mp4'));
      
      // Đọc thông tin metadata từ file (nếu có)
      let metadata = {};
      const metadataPath = path.join(slideshowDir, 'metadata.json');
      if (fs.existsSync(metadataPath)) {
        const metadataRaw = fs.readFileSync(metadataPath, 'utf8');
        metadata = JSON.parse(metadataRaw);
      }
      
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      
      res.status(200).json({
        success: true,
        slideshow: {
          id: req.params.id,
          createdAt: new Date(parseInt(req.params.id)).toISOString(),
          hasVideo,
          hasSubtitles,
          videoUrl: hasVideo ? `${baseUrl}/api/videos/${req.params.id}` : null,
          videoWithSubsUrl: hasSubtitles ? `${baseUrl}/api/videos/${req.params.id}/with-subs` : null,
          metadata
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };
}

export default VideoController;