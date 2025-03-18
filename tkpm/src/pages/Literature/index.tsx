import { useState } from 'react';
import axios from 'axios';

interface WikipediaResponse {
    title: string;
    sections: string[];
    fullText: string;
    url: string;
    displayTitle: string;
    originalImage: string;
    fullContent: string;
}

const Literature = () => {
    const [query, setQuery] = useState('');
    const [result, setResult] = useState<WikipediaResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showFullContent, setShowFullContent] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setResult(null);
        setShowFullContent(false);

        try {
            const response = await axios.get(`http://localhost:3000/literature/wikipedia?query=${encodeURIComponent(query)}`);
            setResult(response.data);
        } catch (err) {
            setError('Không thể tìm thấy thông tin. Vui lòng thử lại.');
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = async () => {
        try {
            const textToCopy = showFullContent ? result?.fullContent : result?.fullText;
            await navigator.clipboard.writeText(textToCopy || '');
            alert('Đã sao chép nội dung vào clipboard!');
        } catch (err) {
            console.error('Failed to copy text: ', err);
            alert('Không thể sao chép nội dung. Vui lòng thử lại.');
        }
    };

    return (
        <div className="container mt-4">
            <h2 className="mb-4">Tìm kiếm thông tin văn học</h2>
            
            <form onSubmit={handleSearch} className="mb-4">
                <div className="input-group">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Nhập tên tác phẩm văn học..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        required
                    />
                    <button type="submit" className="btn btn-primary">
                        Tìm kiếm
                    </button>
                </div>
            </form>

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

            {result && (
                <div className="card">
                    <div className="card-body">
                        {/* Header với hình ảnh và tiêu đề */}
                        <div className="d-flex align-items-start mb-4">
                            {result.originalImage && (
                                <img 
                                    src={result.originalImage} 
                                    alt={result.displayTitle}
                                    className="me-3"
                                    style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'cover' }}
                                />
                            )}
                            <div>
                                <h5 className="card-title">{result.displayTitle}</h5>
                                <p className="text-muted mb-2">Tiêu đề gốc: {result.title}</p>
                                <a 
                                    href={result.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="btn btn-outline-primary btn-sm"
                                >
                                    Xem trên Wikipedia
                                </a>
                            </div>
                        </div>

                        {/* Nút chuyển đổi giữa tóm tắt và nội dung đầy đủ */}
                        <div className="mb-4">
                            <button 
                                className="btn btn-outline-secondary"
                                onClick={() => setShowFullContent(!showFullContent)}
                            >
                                {showFullContent ? 'Xem tóm tắt' : 'Xem nội dung đầy đủ'}
                            </button>
                        </div>
                        
                        {/* Nội dung */}
                        {showFullContent ? (
                            <div 
                                className="wiki-content"
                                dangerouslySetInnerHTML={{ __html: result.fullContent }}
                            />
                        ) : (
                            <div className="sections-container">
                                {result.sections.map((section, index) => (
                                    <div key={index} className="mb-4">
                                        <p className="card-text">{section}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Các nút chức năng */}
                        <div className="mt-4 d-flex gap-2">
                            <button 
                                className="btn btn-secondary"
                                onClick={handleCopy}
                            >
                                Sao chép nội dung
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Literature;