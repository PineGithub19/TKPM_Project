import { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';

interface ScriptResponse {
    success: boolean;
    script: string;
}

const ScriptAutoGenerate = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [script, setScript] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [editInstructions, setEditInstructions] = useState('');
    const [editedScript, setEditedScript] = useState<string>('');

    useEffect(() => {
        // Lấy dữ liệu từ location state
        const { content, title } = location.state || {};
        
        if (!content || !title) {
            setError('Không tìm thấy nội dung tác phẩm');
            return;
        }

        generateScript(content, title);
    }, [location]);

    const generateScript = async (content: string, title: string) => {
        setLoading(true);
        setError(null);

        try {
            const response = await axios.post<ScriptResponse>('http://localhost:3000/script_generate/generate', {
                content,
                title
            });

            if (response.data.success) {
                setScript(response.data.script);
            } else {
                setError('Không thể tạo kịch bản');
            }
        } catch (err) {
            setError('Lỗi khi tạo kịch bản');
            console.error('Error generating script:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = async () => {
        if (!editInstructions) {
            setError('Vui lòng nhập hướng dẫn chỉnh sửa');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await axios.post<ScriptResponse>('http://localhost:3000/script_generate/edit', {
                originalScript: script,
                editInstructions
            });

            if (response.data.success) {
                setEditedScript(response.data.script);
                setEditMode(false);
            } else {
                setError('Không thể chỉnh sửa kịch bản');
            }
        } catch (err) {
            setError('Lỗi khi chỉnh sửa kịch bản');
            console.error('Error editing script:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = async () => {
        try {
            const textToCopy = editedScript || script;
            await navigator.clipboard.writeText(textToCopy);
            alert('Đã sao chép kịch bản vào clipboard!');
        } catch (err) {
            console.error('Failed to copy text: ', err);
            alert('Không thể sao chép kịch bản');
        }
    };

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Kịch bản video</h2>
                <button 
                    className="btn btn-outline-primary"
                    onClick={() => navigate('/literature')}
                >
                    Quay lại
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

            {!loading && !error && (
                <>
                    {editMode ? (
                        <div className="mb-4">
                            <h4>Chỉnh sửa kịch bản</h4>
                            <div className="form-group">
                                <label htmlFor="editInstructions">Hướng dẫn chỉnh sửa:</label>
                                <textarea
                                    id="editInstructions"
                                    className="form-control"
                                    rows={3}
                                    value={editInstructions}
                                    onChange={(e) => setEditInstructions(e.target.value)}
                                />
                            </div>
                            <button 
                                className="btn btn-primary mt-2"
                                onClick={handleEdit}
                            >
                                Áp dụng chỉnh sửa
                            </button>
                        </div>
                    ) : (
                        <button 
                            className="btn btn-secondary mb-4"
                            onClick={() => setEditMode(true)}
                        >
                            Chỉnh sửa kịch bản
                        </button>
                    )}

                    <div className="card">
                        <div className="card-body">
                            <pre className="whitespace-pre-wrap">
                                {editedScript || script}
                            </pre>
                        </div>
                    </div>

                    <div className="mt-4">
                        <button 
                            className="btn btn-primary"
                            onClick={handleCopy}
                        >
                            Sao chép kịch bản
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default ScriptAutoGenerate; 