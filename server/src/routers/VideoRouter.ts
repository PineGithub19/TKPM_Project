import express from 'express';
import VideoController from '../controllers/VideoController';

const videoController = new VideoController();
const router = express.Router();

// Route upload file
router.post('/upload', videoController.handleUpload(), videoController.uploadFiles);

// Route tạo slideshow
router.post('/generate', (req, res, next) =>  {videoController.generateSlideshow(req, res, next)});

// Route lấy video
router.get('/:id',(req, res, next) => {videoController.getVideo(req, res, next)});

// Route lấy video với phụ đề
router.get('/:id/with-subs',(req, res, next) => {videoController.getVideoWithSubs(req, res, next)});

// Route xóa slideshow
router.delete('/:id',(req, res, next) => {videoController.deleteSlideshow(req, res, next)});

// Route lấy danh sách slideshow
router.get('/', videoController.listSlideshows);

// Route lấy chi tiết slideshow
router.get('/:id/details',(req, res, next) => {videoController.getSlideshowDetails(req, res, next)});

export default router;