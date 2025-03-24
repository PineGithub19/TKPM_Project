import { useState } from 'react';
// import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import * as request from '../../utils/request';

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

const Literature = () => {
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
            // const response = await axios.get<WikipediaResponse>(
            //     `http://localhost:3000/literature/wikipedia?query=${encodeURIComponent(query)}`,
            // );
            const response = (await request.get(
                `/literature/wikipedia?query=${encodeURIComponent(query)}`,
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
            navigate('/generate_scrip', {
                state: {
                    content: response.data.fullText,
                    title: response.data.title,
                },
            });
        }
    };

    return (
        <div className="container mt-4">
            <h2>Tìm kiếm tác phẩm văn học</h2>
            <div className="input-group mb-3">
                <input
                    type="text"
                    className="form-control"
                    placeholder="Nhập tên tác phẩm..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchWikipedia()}
                />
                <button className="btn btn-primary" onClick={searchWikipedia}>
                    Tìm kiếm
                </button>
            </div>

            {loading && (
                <div className="text-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            )}

            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            )}

            {response?.data && (
                <div className="card">
                    <div className="card-body">
                        <h3 className="card-title">{response.data.displayTitle}</h3>

                        <div className="mb-3">
                            <button
                                className="btn btn-secondary me-2"
                                onClick={() => setShowFullContent(!showFullContent)}
                            >
                                {showFullContent ? 'Xem tóm tắt' : 'Xem toàn bộ nội dung'}
                            </button>
                            <button className="btn btn-primary me-2" onClick={handleCopy}>
                                Sao chép nội dung
                            </button>
                            <button className="btn btn-success" onClick={handleGenerateScript}>
                                Tạo kịch bản video
                            </button>
                        </div>

                        {showFullContent ? (
                            <div className="content" dangerouslySetInnerHTML={{ __html: response.data.fullText }} />
                        ) : (
                            <div>
                                {response.data.sections.map((section, index) => (
                                    <div key={index} className="mb-4">
                                        <h4>{section.title}</h4>
                                        <div
                                            className="content"
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
