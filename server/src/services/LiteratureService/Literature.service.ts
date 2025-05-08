import axios from 'axios';

interface WikipediaSection {
    title: string;
    content: string;
}

interface WikipediaSearchResult {
    title: string;
    sections: WikipediaSection[];
    sumaryText: string;
    url: string;
    displayTitle: string;
    originalImage?: string;
    fullText: string;
}

class LiteratureService {
    private wikiUrl = 'https://vi.wikipedia.org/w/api.php';

    async searchWikipedia(query: string): Promise<WikipediaSearchResult> {
        if (!query) {
            throw new Error('Query parameter is required');
        }

        // Đầu tiên tìm kiếm các bài viết liên quan
        const searchResults = await this.findWikipediaArticles(query);
        
        if (!searchResults.length) {
            throw new Error('Không tìm thấy thông tin về tác phẩm này');
        }

        // Lấy bài viết đầu tiên từ kết quả tìm kiếm
        const firstResult = searchResults[0];
        
        // Lấy nội dung chi tiết của bài viết
        const pageContent = await this.getArticleContent(firstResult.title);

        if (!pageContent) {
            throw new Error('Không tìm thấy thông tin về tác phẩm này');
        }

        // Lấy thêm thông tin về tác giả và các thông tin khác
        const pageInfo = await this.getArticleInfo(firstResult.title);

        // Lấy toàn bộ nội dung bài viết
        const fullContent = await this.getFullArticleContent(firstResult.title);

        // Chia nội dung thành các đoạn và tạo sections
        const sections = this.parseContentIntoSections(pageContent.extract);

        return {
            title: pageContent.title,
            sections,
            sumaryText: pageContent.extract,
            url: pageInfo.fullurl,
            displayTitle: pageInfo.displaytitle,
            originalImage: pageInfo.original?.source,
            fullText: fullContent
        };
    }

    private async findWikipediaArticles(query: string): Promise<any[]> {
        const searchParams = {
            action: 'query',
            format: 'json',
            list: 'search',
            srsearch: query,
            srlimit: 5,
            origin: '*'
        };

        const searchResponse = await axios.get(this.wikiUrl, { params: searchParams });
        return searchResponse.data.query.search;
    }

    private async getArticleContent(title: string): Promise<any> {
        const contentParams = {
            action: 'query',
            format: 'json',
            prop: 'extracts',
            exintro: false,
            explaintext: true,
            exsentences: 1000,
            exlimit: 1,
            titles: title,
            origin: '*'
        };

        const contentResponse = await axios.get(this.wikiUrl, { params: contentParams });
        const page = Object.values(contentResponse.data.query.pages)[0] as any;
        
        if (page.missing) {
            return null;
        }
        
        return page;
    }

    private async getArticleInfo(title: string): Promise<any> {
        const infoParams = {
            action: 'query',
            format: 'json',
            prop: 'info|pageimages',
            inprop: 'url|displaytitle',
            piprop: 'original',
            titles: title,
            origin: '*'
        };

        const infoResponse = await axios.get(this.wikiUrl, { params: infoParams });
        return Object.values(infoResponse.data.query.pages)[0] as any;
    }

    private async getFullArticleContent(title: string): Promise<string> {
        const fullContentParams = {
            action: 'parse',
            format: 'json',
            page: title,
            prop: 'text',
            origin: '*'
        };

        const fullContentResponse = await axios.get(this.wikiUrl, { params: fullContentParams });
        return fullContentResponse.data.parse.text['*'];
    }

    private parseContentIntoSections(content: string): WikipediaSection[] {
        return content.split('\n\n')
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
    }
}

export default LiteratureService;