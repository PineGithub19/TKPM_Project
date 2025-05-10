import { Request, Response, NextFunction } from 'express';
import { literatureService } from '../services/LiteratureService/Literature.service';

class LiteratureController {
    async searchWikipedia(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { query } = req.query;

            if (!query || typeof query !== 'string') {
                res.status(400).json({ success: false, message: 'Query parameter is required' });
                return;
            }

            const result = await literatureService.searchWikipedia(query);

            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            console.error('Error fetching Wikipedia data:', error);
            const errorMessage = error instanceof Error ? error.message : 'Lỗi khi lấy dữ liệu từ Wikipedia';

            // Xử lý các loại lỗi khác nhau
            if (errorMessage.includes('Không tìm thấy')) {
                res.status(404).json({ success: false, message: errorMessage });
            } else {
                res.status(500).json({ success: false, message: errorMessage });
            }
        }
    }
}

export default LiteratureController;
