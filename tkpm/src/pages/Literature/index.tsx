import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as request from '../../utils/request';
import clsx from 'clsx';
import styles from './Literature.module.css';

interface WikipediaResponse {
    success: boolean;
    data: {
        title: string;
        sections: Array<{
            title: string;
            content: string;
        }>;
        summaryText: string;
        url: string;
        displayTitle: string;
        originalImage: string;
        fullText: string;
    };
}

interface LiteratureProps {
    onSelectLiterature?: (content: string, title: string) => void;
}

const Literature = ({ onSelectLiterature }: LiteratureProps) => {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [response, setResponse] = useState<WikipediaResponse | null>(null);
    const [showFullContent, setShowFullContent] = useState(false);
    const navigate = useNavigate();

    const searchWikipedia = async () => {
        if (!query.trim()) {
            setError('Vui lòng nhập từ khóa tìm kiếm');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = (await request.get(
                `/literature/wikipedia?query=${encodeURIComponent(query)}`
            )) as WikipediaResponse | null;

            if (response !== null && response.success) {
                setResponse(response);
            }
        } catch (err) {
            setError('Lỗi khi tìm kiếm');
            console.error('Error searching Wikipedia:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = async () => {
        try {
            const textToCopy = showFullContent ? response?.data.fullText : response?.data.sections[0]?.content;
            if (textToCopy) {
                await navigator.clipboard.writeText(textToCopy);
                alert('Đã sao chép nội dung vào clipboard!');
            }
        } catch (err) {
            console.error('Failed to copy text: ', err);
            alert('Không thể sao chép nội dung');
        }
    };

    const handleGenerateScript = () => {
        if (response?.data) {
            if (onSelectLiterature) {
                onSelectLiterature(response.data.fullText, response.data.title);
            } else {
                navigate('/generate_script', {
                    state: {
                        content: response.data.fullText,
                        title: response.data.title,
                    },
                });
            }
        }
    };

    const cleanTitle = (title: string) => {
        return title.replace(/<[^>]+>/g, '');
    };

    return (
        <div className={clsx(styles.container)}>
            <h2 className={clsx(styles.title)}>Tìm kiếm tác phẩm văn học</h2>

            <div className={clsx(styles.inputGroup)}>
                <input
                    type="text"
                    className={clsx(styles.input)}
                    placeholder="Nhập tên tác phẩm..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchWikipedia()}
                />
                <button className={clsx(styles.searchButton)} onClick={searchWikipedia}>
                    Tìm kiếm
                </button>
            </div>

            {loading && (
                <div className={clsx(styles.spinner)}>
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            )}

            {error && (
                <div className={clsx(styles.errorAlert)} role="alert">
                    {error}
                </div>
            )}

            {response?.data && (
                <div className={clsx(styles.card)}>
                    <div className={clsx(styles.cardBody)}>
                        <h3 className={clsx(styles.cardTitle)}>{cleanTitle(response.data.displayTitle)}</h3>
                        <div className={clsx(styles.buttonsContainer)}>
                            <button
                                className={clsx(styles.toggleContentButton)}
                                onClick={() => setShowFullContent(!showFullContent)}
                            >
                                {showFullContent ? 'Xem tóm tắt' : 'Xem toàn bộ nội dung'}
                            </button>
                            <button className={clsx(styles.copyButton)} onClick={handleCopy}>
                                Sao chép nội dung
                            </button>
                            <button className={clsx(styles.generateScriptButton)} onClick={handleGenerateScript}>
                                {onSelectLiterature ? 'Chọn tác phẩm này' : 'Tạo kịch bản video'}
                            </button>
                        </div>

                        {showFullContent ? (
                            <div
                                className={clsx(styles.content)}
                                dangerouslySetInnerHTML={{ __html: response.data.fullText }}
                            />
                        ) : (
                            <div>
                                {response.data.sections.map((section, index) => (
                                    <div key={index} className={clsx(styles.section)}>
                                        <h4 className={clsx(styles.sectionTitle)}>{section.title}</h4>
                                        <div
                                            className={clsx(styles.sectionContent)}
                                            dangerouslySetInnerHTML={{ __html: section.content }}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Literature;
