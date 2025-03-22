import { Request, Response, NextFunction } from 'express';
import axios from 'axios';

class LiteratureController {
    async searchWikipedia(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { query } = req.query;

            if (!query || typeof query !== 'string') {
                res.status(400).json({ success: false, message: 'Query parameter is required' });
                return;
            }

            // Wikipedia API endpoint
            const wikiUrl = `https://vi.wikipedia.org/w/api.php`;
            
            // Đầu tiên tìm kiếm các bài viết liên quan
            const searchParams = {
                action: 'query',
                format: 'json',
                list: 'search',
                srsearch: query,
                srlimit: 5,
                origin: '*'
            };

            const searchResponse = await axios.get(wikiUrl, { params: searchParams });
            
            if (!searchResponse.data.query.search.length) {
                res.status(404).json({ success: false, message: 'Không tìm thấy thông tin về tác phẩm này' });
                return;
            }

            // Lấy bài viết đầu tiên từ kết quả tìm kiếm
            const firstResult = searchResponse.data.query.search[0];
            
            // Lấy nội dung chi tiết của bài viết
            const contentParams = {
                action: 'query',
                format: 'json',
                prop: 'extracts',
                exintro: false,
                explaintext: true,
                exsentences: 1000,
                exlimit: 1,
                titles: firstResult.title,
                origin: '*'
            };

            const contentResponse = await axios.get(wikiUrl, { params: contentParams });
            const page = Object.values(contentResponse.data.query.pages)[0] as any;

            if (page.missing) {
                res.status(404).json({ success: false, message: 'Không tìm thấy thông tin về tác phẩm này' });
                return;
            }

            // Lấy thêm thông tin về tác giả và các thông tin khác
            const infoParams = {
                action: 'query',
                format: 'json',
                prop: 'info|pageimages',
                inprop: 'url|displaytitle',
                piprop: 'original',
                titles: firstResult.title,
                origin: '*'
            };

            const infoResponse = await axios.get(wikiUrl, { params: infoParams });
            const pageInfo = Object.values(infoResponse.data.query.pages)[0] as any;

            // Lấy toàn bộ nội dung bài viết
            const fullContentParams = {
                action: 'parse',
                format: 'json',
                page: firstResult.title,
                prop: 'text',
                origin: '*'
            };

            const fullContentResponse = await axios.get(wikiUrl, { params: fullContentParams });
            const fullContent = fullContentResponse.data.parse.text['*'];

            // Chia nội dung thành các đoạn và tạo sections
            const sections = page.extract.split('\n\n')
                .filter((section: string) => section.trim())
                .map((section: string, index: number) => {
                    const lines = section.split('\n');
                    const title = lines[0] || `Phần ${index + 1}`;
                    const content = lines.slice(1).join('\n');
                    return {
                        title,
                        content
                    };
                });

            res.status(200).json({
                success: true,
                data: {
                    title: page.title,
                    sections,
                    sumaryText: page.extract,
                    url: pageInfo.fullurl,
                    displayTitle: pageInfo.displaytitle,
                    originalImage: pageInfo.original?.source,
                    fullText: fullContent
                }
            });
        } catch (error) {
            console.error('Error fetching Wikipedia data:', error);
            res.status(500).json({ success: false, message: 'Lỗi khi lấy dữ liệu từ Wikipedia' });
        }
    }
}

export default LiteratureController; 