const fs = require("fs");
const path = require("path");
const ffmpegPath = require("ffmpeg-static");
const ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath(ffmpegPath);

// Cấu hình mặc định có thể tùy chỉnh
const config = {
  // Thư mục và đường dẫn
  imagesDir: path.join(__dirname, "images"),
  outputDir: path.join(__dirname, "tmp_videos"),
  finalOutputPath: path.join(__dirname, "final_output.mp4"),
  finalWithHardSubsPath: path.join(__dirname, "final_with_hardsubs.mp4"),

  // Cấu hình video
  videoDuration: 5, // Thời gian mỗi ảnh (giây)
  resolution: { width: 1920, height: 1080 },
  frameRate: 30,
  videoBitrate: "4M",

  // Cấu hình audio
  audioPath: path.join(__dirname, "background.mp3"),
  audioVolume: 1.0, // Mặc định
  audioBitrate: "192k",

  // Hiệu ứng mặc định
  defaultEffects: {
    fade: true,
    fadeInDuration: 1, // Giây
    fadeOutDuration: 1, // Giây
    zoomDirection: "none", // "in", "out", "none"
    zoomAmount: 1.1, // 10% zoom
    panDirection: "none", // "left", "right", "up", "down", "none"
    panAmount: 0.1, // 10% pan
  },

  // Phụ đề
  addHardSubtitles: true, // Thêm phụ đề cứng vào video cuối cùng


  // Tùy chọn nâng cao
  cleanupTemp: true,
  videoCodec: "libx264",
  audioCodec: "aac",
  pixelFormat: "yuv420p",
};

// Lớp chính để tạo slideshow
class SlideshowGenerator {
  constructor(userConfig = {}) {
    // Gộp cấu hình người dùng vào cấu hình mặc định
    this.config = { ...config, ...userConfig };
    this.videoFiles = [];
    this.images = [];

    // Tạo thư mục đầu ra nếu chưa tồn tại
    if (!fs.existsSync(this.config.outputDir)) {
      fs.mkdirSync(this.config.outputDir, { recursive: true });
    }
  }

  // Khởi tạo và lấy danh sách ảnh
  initialize() {
    // Lấy danh sách ảnh từ thư mục hoặc mảng được cung cấp
    if (Array.isArray(this.config.images)) {
      this.images = this.config.images;
    } else {
      this.images = fs
        .readdirSync(this.config.imagesDir)
        .filter((file) => /\.(jpg|jpeg|png|webp)$/i.test(file))
        .map((filename) => ({
          path: path.join(this.config.imagesDir, filename),
          duration: this.config.videoDuration,
          title: filename.replace(/\.(jpg|jpeg|png|webp)$/i, ""),
        }));
    }

    console.log(`🖼️ Đã tìm thấy ${this.images.length} ảnh`);
    return this;
  }

  // Tạo video từ một ảnh với hiệu ứng riêng
  async createVideoFromImage(imageInfo, index) {
    return new Promise((resolve, reject) => {
      const inputImage = typeof imageInfo === "string" ? imageInfo : imageInfo.path;
      const duration = imageInfo.duration || this.config.videoDuration;
      const outputVideo = path.join(this.config.outputDir, `video_${index}.mp4`);
      this.videoFiles.push(outputVideo);
  
      console.log(`🔄 [${index + 1}/${this.images.length}] Xử lý: ${path.basename(inputImage)}`);
  
      // Hiệu ứng
      const effects = imageInfo.effects || this.config.defaultEffects;
      const speed = imageInfo.speed || 1.0;
      const adjustedDuration = duration / speed;
  
      let filterChain = [];
  
      // Bước 1: Scale ảnh với aspect ratio giữ nguyên
      filterChain.push(
        `[0:v]scale=${this.config.resolution.width}:${this.config.resolution.height}:force_original_aspect_ratio=decrease`
      );
      filterChain.push(
        `pad=${this.config.resolution.width}:${this.config.resolution.height}:(ow-iw)/2:(oh-ih)/2:black`
      );
  
      // Bước 2: Zoom + Pan (Ken Burns)
      if (effects.zoomDirection !== "none" || effects.panDirection !== "none") {
        let zoomStart = 1, zoomEnd = 1, xStart = 0, yStart = 0, xEnd = 0, yEnd = 0;
        const zoomAmount = effects.zoomAmount || 1.1;
        const panAmount = effects.panAmount || 0.1;
  
        if (effects.zoomDirection === "in") {
          zoomEnd = zoomAmount;
        } else if (effects.zoomDirection === "out") {
          zoomStart = zoomAmount;
        }
  
        switch (effects.panDirection) {
          case "left": xStart = panAmount; break;
          case "right": xEnd = panAmount; break;
          case "up": yStart = panAmount; break;
          case "down": yEnd = panAmount; break;
        }
  
        filterChain.push(
          `zoompan=z='if(lte(in,1),${zoomStart},min(zoom+0.002,${zoomEnd}))':` +
          `x='iw*${xStart}+(iw*${xEnd}-iw*${xStart})*in/duration':` +
          `y='ih*${yStart}+(ih*${yEnd}-ih*${yStart})*in/duration':` +
          `d=${Math.round(adjustedDuration * this.config.frameRate)}:fps=${this.config.frameRate}`
        );
      }
      //Buớc 3: Deleted
  
      // Bước 4: Thêm fade in/out nếu có
      if (effects.fade) {
        const fadeInDuration = effects.fadeInDuration || 1;
        const fadeOutDuration = effects.fadeOutDuration || 1;
        filterChain.push(`fade=t=in:st=0:d=${fadeInDuration},fade=t=out:st=${adjustedDuration - fadeOutDuration}:d=${fadeOutDuration}`);
      }
  
      // Kết hợp filter thành chuỗi hợp lệ
      const filterComplex = `${filterChain.join(",")}[out]`;
      console.log("🔄 Đang xử lý video với hiệu ứng:", filterComplex);

      ffmpeg()
        .input([
            inputImage,
            imageInfo.audioPath
        ])
        .inputOptions("-loop 1")
        .complexFilter(filterComplex, "out")
        .outputOptions([
          `-c:v ${this.config.videoCodec}`,
          `-t ${adjustedDuration}`,
          `-r ${this.config.frameRate}`,
          `-pix_fmt ${this.config.pixelFormat}`,
          `-b:v ${this.config.videoBitrate}`,
        ])
        .on("end", () => {
          console.log(`✅ Video ${index + 1} hoàn thành`);
          resolve();
        })
        .on("error", (err) => {
          console.error(`❌ Lỗi khi xử lý ảnh ${index + 1}:`, err);
          reject(err);
        })
        .save(outputVideo);
    });
  }
  

  // Tạo file phụ đề .srt
  createSubtitleFile() {
    const subtitlePath = path.join(__dirname, "subtitles.srt");

    // Nếu người dùng không cung cấp phụ đề, sử dụng phụ đề mặc định
    const subtitleLines = this.config.subtitles
      .map((subtitle, index) => {
        return `
${index + 1}
${subtitle.startTime} --> ${subtitle.endTime}
${subtitle.text}
`;
      })
      .join("\n");

    fs.writeFileSync(subtitlePath, subtitleLines.trim());
    console.log(`📝 Đã tạo file phụ đề: ${subtitlePath}`);
    return subtitlePath;
  }

  // Thêm phụ đề cứng (hard subtitles) vào video
  addHardSubtitles() {
    return new Promise((resolve, reject) => {
      const subtitleFile = this.createSubtitleFile();

      console.log("🎬 Đang thêm phụ đề cứng vào video...");
      ffmpeg()
        .input(this.config.finalOutputPath)
        .inputOptions("-y")
        .outputOptions([
          `-vf subtitles=${path.basename(subtitleFile)}`,
          `-c:v ${this.config.videoCodec}`,
          "-c:a copy",
        ])
        .on("end", () => {
          console.log("✅ Video với phụ đề cứng đã hoàn thành!");
          resolve();
        })
        .on("error", (err, stdout, stderr) => {
          console.error("❌ Lỗi khi thêm phụ đề cứng:", err);
          console.error("FFmpeg stderr:", stderr);
          reject(err);
        })
        .save(this.config.finalWithHardSubsPath);
    });
  }

  // Dọn dẹp các file tạm
  cleanUpTempFiles() {
    if (!this.config.cleanupTemp) return;

    console.log("🗑️ Đang xóa các file tạm...");

    // Xóa từng file video tạm
    this.videoFiles.forEach((file) => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
        console.log(`✔ Đã xóa: ${file}`);
      }
    });

    // Xóa file danh sách
    const fileListPath = path.join(this.config.outputDir, "file_list.txt");
    if (fs.existsSync(fileListPath)) {
      fs.unlinkSync(fileListPath);
      console.log(`✔ Đã xóa: ${fileListPath}`);
    }

    console.log("🚀 Hoàn tất dọn dẹp!");
  }

  // Tạo video cuối cùng từ các video nhỏ
  async createFinalVideo() {
    // Tạo file danh sách video để concat
    const fileListPath = path.join(this.config.outputDir, "file_list.txt");
    fs.writeFileSync(
      fileListPath,
      this.videoFiles.map((v) => `file '${v.replace(/\\/g, "/")}'`).join("\n")
    );

    return new Promise((resolve, reject) => {
      console.log("🔄 Đang ghép các video lại...");

      const ffmpegCommand = ffmpeg()
        .input(fileListPath)
        .inputOptions(["-f", "concat", "-safe", "0"]);

      // Thêm nhạc nền nếu được cung cấp
      if (this.config.audioPath && fs.existsSync(this.config.audioPath)) {
        ffmpegCommand.input(this.config.audioPath);

        // Lấy volume từ cấu hình
        const volume = this.config.audioVolume || 1.0;

        ffmpegCommand.outputOptions([
          "-c:v copy",
          `-c:a ${this.config.audioCodec}`,
          `-b:a ${this.config.audioBitrate}`,
          `-af volume=${volume}`,
          "-map 0:v:0",
          "-map 1:a:0",
          "-shortest",
        ]);
      } else {
        // Không có nhạc nền
        ffmpegCommand.outputOptions(["-c:v copy", "-an"]);
      }

      ffmpegCommand
        .on("progress", (progress) => {
          if (progress.percent) {
            console.log(`⏳ Tiến độ: ${Math.round(progress.percent)}%`);
          }
        })
        .on("end", () => {
          console.log("✅ Video cuối cùng đã hoàn thành!");
          resolve();
        })
        .on("error", (err, stdout, stderr) => {
          console.error("❌ Lỗi khi ghép video:", err);
          console.error("FFmpeg stderr:", stderr);
          reject(err);
        })
        .save(this.config.finalOutputPath);
    });
  }

  // Xử lý toàn bộ quá trình
  async generate() {
    try {
      // Khởi tạo và lấy danh sách ảnh
      this.initialize();

      // Xử lý từng ảnh
      for (let i = 0; i < this.images.length; i++) {
        await this.createVideoFromImage(this.images[i], i);
      }

      // Tạo video cuối cùng
      await this.createFinalVideo();

      // Thêm phụ đề (tùy chọn)
      if (this.config.addHardSubtitles) {
        await this.addHardSubtitles();
      }

      // Dọn dẹp
      this.cleanUpTempFiles();
      const result = {
        success: true,
        outputPath: this.config.finalOutputPath,
        hardSubsPath: this.config.addHardSubtitles
          ? this.config.finalWithHardSubsPath
          : null,
      };
      console.log("🎉 Quá trình tạo video hoàn tất!", result);
      return result;
    } catch (error) {
      console.error("❌ Lỗi trong quá trình tạo video:", error);
      return { success: false, error };
    }
  }
}

// Ví dụ sử dụng
const customConfig = {
  // Sử dụng mảng ảnh với hiệu ứng riêng cho từng ảnh
  images: [
    {
      path: path.join(__dirname, "images/1.jpg"),
      duration: 7,
      speed: 1.5, // Tăng tốc độ 50%
    //   effects: {
    //     fade: true,
    //     fadeInDuration: 1.0,
    //     fadeOutDuration: 1.0,
    //     zoomDirection: "in", // Zoom vào
    //     zoomAmount: 1.2, // 20% zoom
    //     panDirection: "left", // Pan sang trái
    //     panAmount: 0.15, // 15% pan
    //   },
        // audio: path.join(__dirname, "audio/1.mp3")
    },
    {
      path: path.join(__dirname, "images/2.jpg"),
      duration: 5,
      speed: 1.0, // Tốc độ thường
    //   effects: {
    //     fade: true,
    //     fadeInDuration: 1.5,
    //     fadeOutDuration: 1.5,
    //     zoomDirection: "out", // Zoom ra
    //     zoomAmount: 1.15, // 15% zoom
    //     panDirection: "down", // Pan xuống
    //     panAmount: 0.1, // 10% pan
    //   },
    },
    {
      path: path.join(__dirname, "images/3.jpg"),
      duration: 6,
      speed: 0.8, // Chậm 20%
    //   effects: {
    //     fade: true,
    //     fadeInDuration: 2.0,
    //     fadeOutDuration: 2.0,
    //     zoomDirection: "none", // Không zoom
    //     panDirection: "right", // Pan sang phải
    //     panAmount: 0.2, // 20% pan
    //   },
    },
  ],

  // Cấu hình chung
  videoDuration: 5, // Mặc định cho mỗi ảnh nếu không chỉ định
  resolution: { width: 1860, height: 1000 },

  // Hiệu ứng mặc định (sẽ được áp dụng nếu không chỉ định riêng)
  defaultEffects: {
    fade: true,
    fadeInDuration: 1.0,
    fadeOutDuration: 1.0,
    zoomDirection: "none",
    zoomAmount: 1,
    panDirection: "none",
    panAmount: 0,
  },

  // Âm thanh
  audioVolume: 1.2, // tăng âm lượng 20%
  // Phụ đề
  subtitles: [
    {
      startTime: "00:00:00,000",
      endTime: "00:00:05,000",
      text: "Đây là demo video slideshow\nVới phụ đề tùy chỉnhĐây là demo video slideshow\nVới phụ đề tùy chỉnhĐây là demo video slideshow\nVới phụ đề tùy chỉnh",
    },
    {
      startTime: "00:00:05,000",
      endTime: "00:00:10,000",
      text: "Mỗi ảnh có thể có phụ đề riêng",
    },
    {
      startTime: "00:00:10,000",
      endTime: "00:00:15,000",
      text: "Hiệu ứng Ken Burns làm cho video sinh động hơn",
    },
  ],
  
  // Khác
  cleanupTemp: true,
};

// Chạy script
const slideshow = new SlideshowGenerator(customConfig);
// Hoặc chạy với cấu hình mặc định
// const slideshow = new SlideshowGenerator();
slideshow.generate();

// EXPORT LỚP ĐỂ CÓ THỂ SỬ DỤNG Ở NƠI KHÁC
module.exports = SlideshowGenerator;
