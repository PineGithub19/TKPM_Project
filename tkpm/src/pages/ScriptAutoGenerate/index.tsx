import { useState, useEffect } from 'react';
// import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import * as request from '../../utils/request';
import styles from './ScriptAutoGenerate.module.css';
import clsx from 'clsx';

interface ScriptResponse {
    success: boolean;
    script: string;
}

interface ScriptSegmentsResponse {
    success: boolean;
    segments: string[];
}

interface ScriptConfig {
    genre: string;
    audience: string;
    tone: string;
    duration: string;
}

interface ScriptAutoGenerateProps {
    promptId: string;
    literatureContent?: string;
    literatureTitle?: string;
    scriptSegment?: string[];
    onComplete?: (segments: string[], title: string) => void;
}

const ScriptAutoGenerate = ({ promptId, literatureContent, literatureTitle, scriptSegment, onComplete }: ScriptAutoGenerateProps) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [script, setScript] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [editInstructions, setEditInstructions] = useState('');
    const [editedScript, setEditedScript] = useState<string>('');
    const [configMode, setConfigMode] = useState(true);
    const [scriptContent, setScriptContent] = useState<{ content: string; title: string } | null>(null);
    const [scriptConfig, setScriptConfig] = useState<ScriptConfig>({
        genre: 'educational',
        audience: 'general',
        tone: 'formal',
        duration: 'standard',
    });
    const [scriptSegments, setScriptSegments] = useState<string[]>(scriptSegment? scriptSegment : []);
    const [showSegments, setShowSegments] = useState(false);
    const [segmentLoading, setSegmentLoading] = useState(false);
    const [scriptTitle, setScriptTitle] = useState<string>('');

    // Danh sách các tùy chọn
    const genreOptions = [
        { value: 'educational', label: 'Giáo dục' },
        { value: 'fantasy', label: 'Giả tưởng' },
        { value: 'science', label: 'Khoa học' },
        { value: 'historical', label: 'Lịch sử' },
        { value: 'dramatic', label: 'Kịch tính' },
        { value: 'comedy', label: 'Hài hước' },
    ];

    const audienceOptions = [
        { value: 'general', label: 'Đại chúng' },
        { value: 'children', label: 'Trẻ em' },
        { value: 'teenagers', label: 'Thanh thiếu niên' },
        { value: 'adults', label: 'Người lớn' },
        { value: 'students', label: 'Học sinh / Sinh viên' },
        { value: 'educators', label: 'Giáo viên / Giảng viên' },
    ];

    const toneOptions = [
        { value: 'formal', label: 'Trang trọng' },
        { value: 'casual', label: 'Thân thiện' },
        { value: 'enthusiastic', label: 'Hào hứng' },
        { value: 'nostalgic', label: 'Hoài niệm' },
        { value: 'analytical', label: 'Phân tích' },
        { value: 'conversational', label: 'Đối thoại' },
    ];

    const durationOptions = [
        { value: 'short', label: 'Ngắn (2-3 phút)' },
        { value: 'standard', label: 'Tiêu chuẩn (4-5 phút)' },
        { value: 'long', label: 'Dài (7-10 phút)' },
    ];

    useEffect(() => {
        // First check if props are provided (integration mode)
        if (literatureContent && literatureTitle) {
            setScriptContent({
                content: literatureContent,
                title: literatureTitle,
            });
            setScriptTitle(literatureTitle);
            return;
        }

        // Otherwise use location state (standalone mode)
        const { content, title } = location.state || {};

        if (!content || !title) {
            setError('Không tìm thấy nội dung tác phẩm');
            return;
        }

        setScriptContent({ content, title });
        setScriptTitle(title);
        // Không tự động tạo kịch bản nữa, mà để người dùng cấu hình trước
    }, [location, literatureContent, literatureTitle]);

    const handleConfigChange = (field: keyof ScriptConfig, value: string) => {
        setScriptConfig((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleGenerateWithConfig = () => {
        if (!scriptContent) {
            setError('Không tìm thấy nội dung tác phẩm');
            return;
        }
        generateScript(scriptContent.content, scriptContent.title, scriptConfig);
        setConfigMode(false);
    };

    const generateScript = async (content: string, title: string, config: ScriptConfig) => {
        setLoading(true);
        setError(null);

        try {
            const response = (await request.post('/script_generate/generate', {
                content,
                title,
                config,
            })) as ScriptResponse | null;

            if (response !== null && response.success) {
                setScript(response.script);
                // Reset segmented script when generating a new script
                setScriptSegments([]);
                setShowSegments(false);

                // Automatically generate segments after script generation
                if (response.script) {
                    generateSegments(response.script);
                }
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

    const generateSegments = async (scriptText: string) => {
        setSegmentLoading(true);

        try {
            const response = (await request.post('/script_generate/split', {
                promptId: promptId,
                script: scriptText,
            })) as ScriptSegmentsResponse | null;

            if (response !== null && response.success) {
                setScriptSegments(response.segments);
            }
        } catch (err) {
            console.error('Error auto-splitting script:', err);
            // Don't show error for auto-splitting
        } finally {
            setSegmentLoading(false);
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
            const response = (await request.post('/script_generate/edit', {
                originalScript: script,
                editInstructions,
            })) as ScriptResponse | null;

            if (response !== null && response.success) {
                setEditedScript(response.script);
                setEditMode(false);
                // Reset segmented script when editing script
                setScriptSegments([]);
                setShowSegments(false);

                // Automatically generate segments after script edit
                if (response.script) {
                    generateSegments(response.script);
                }
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

    const handleSplitScript = async () => {
        setSegmentLoading(true);
        setError(null);

        try {
            const textToSplit = editedScript || script;
            const response = (await request.post('/script_generate/split', {
                promptId: promptId,
                script: textToSplit,
            })) as ScriptSegmentsResponse | null;

            if (response !== null && response.success) {
                setScriptSegments(response.segments);
                setShowSegments(true);
            } else {
                setError('Không thể tách kịch bản thành các phân đoạn');
            }
        } catch (err) {
            setError('Lỗi khi tách kịch bản');
            console.error('Error splitting script:', err);
        } finally {
            setSegmentLoading(false);
        }
    };

    const handleCopySegment = async (segment: string, index: number) => {
        try {
            await navigator.clipboard.writeText(segment);
            alert(`Đã sao chép phân đoạn #${index + 1} vào clipboard!`);
        } catch (err) {
            console.error('Failed to copy segment: ', err);
            alert('Không thể sao chép phân đoạn');
        }
    };

    const handleContinue = () => {
        if (onComplete) {
            // If no segments are available but we have a script, automatically generate segments
            if (scriptSegments.length === 0 && (script || editedScript)) {
                const textToSplit = editedScript || script;

                setSegmentLoading(true);

                request
                    .post('/script_generate/split', {
                        promptId: promptId,
                        script: textToSplit,
                    })
                    .then((response: ScriptSegmentsResponse | null) => {
                        if (response !== null && response.success) {
                            // Call onComplete with the generated segments
                            onComplete(response.segments, scriptTitle);
                        } else {
                            // If splitting fails, create a single segment from the full script
                            onComplete([textToSplit], scriptTitle);
                        }
                    })
                    .catch(() => {
                        // If error occurs, use full script as a single segment
                        onComplete([textToSplit], scriptTitle);
                    })
                    .finally(() => {
                        setSegmentLoading(false);
                    });
            } else {
                // Use already generated segments
                onComplete(scriptSegments, scriptTitle);
            }
        }
    };

    const renderConfigForm = () => (
        <div className={clsx(styles.card, styles.mb4)}>
            <div className={clsx(styles.cardHeader)}>
                <h4 className={clsx(styles.cardTitle)}>Cấu hình kịch bản</h4>
            </div>
            <div className={clsx(styles.cardBody)}>
                <div className={clsx(styles.inputGroup)}>
                    <div className={clsx(styles.formGroup)}>
                        <label className={clsx(styles.formLabel)}>Thể loại:</label>
                        <select
                            className={clsx(styles.formSelect)}
                            value={scriptConfig.genre}
                            onChange={(e) => handleConfigChange('genre', e.target.value)}
                        >
                            {genreOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={clsx(styles.formGroup)}>
                        <label className={clsx(styles.formLabel)}>Đối tượng:</label>
                        <select
                            className={clsx(styles.formSelect)}
                            value={scriptConfig.audience}
                            onChange={(e) => handleConfigChange('audience', e.target.value)}
                        >
                            {audienceOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={clsx(styles.formGroup)}>
                        <label className={clsx(styles.formLabel)}>Giọng điệu:</label>
                        <select
                            className={clsx(styles.formSelect)}
                            value={scriptConfig.tone}
                            onChange={(e) => handleConfigChange('tone', e.target.value)}
                        >
                            {toneOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={clsx(styles.formGroup)}>
                        <label className={clsx(styles.formLabel)}>Độ dài:</label>
                        <select
                            className={clsx(styles.formSelect)}
                            value={scriptConfig.duration}
                            onChange={(e) => handleConfigChange('duration', e.target.value)}
                        >
                            {durationOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className={clsx(styles.buttonGrid)}>
                    <button
                        className={clsx(styles.primaryButton)}
                        onClick={handleGenerateWithConfig}
                        disabled={loading}
                    >
                        Tạo kịch bản với cấu hình này
                    </button>
                </div>
            </div>
        </div>
    );

    const renderScriptSegments = () => (
        <div className={clsx(styles.card, styles.mb4)}>
            <div className={clsx(styles.cardHeader, styles.segmentHeader)}>
                <h5 className={clsx(styles.cardTitle)}>Các phân đoạn kịch bản</h5>
                <button className={clsx(styles.backBtn)} onClick={() => setShowSegments(false)}>
                    Quay lại kịch bản đầy đủ
                </button>
            </div>
            <div className={clsx(styles.cardBody)}>
                <p className={clsx(styles.textMuted)}>
                    Mỗi phân đoạn dưới đây có thể được sử dụng để tạo một bức ảnh hoặc cảnh trong video
                </p>
                {scriptSegments.map((segment, index) => (
                    <div key={index} className={clsx(styles.card, styles.mb3)}>
                        <div className={clsx(styles.segmentCardHeader)}>
                            <h6 className={clsx(styles.cardSegmentTitle)}>Phân đoạn #{index + 1}</h6>
                            <button
                                className={clsx(styles.primaryButton, styles.btnSm, styles.copyBtn)}
                                onClick={() => handleCopySegment(segment, index)}
                            >
                                Sao chép
                            </button>
                        </div>
                        <div className={clsx(styles.cardBody)}>
                            <p className={clsx(styles.textMuted)}>{segment}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className={clsx(styles.container)}>
            <div className={clsx(styles.header)}>
                <h2 className={clsx(styles.title)}>Kịch bản video</h2>
                {onComplete ? (
                    <div className={clsx(styles.actionButtonContainer)}>
                        {(script || editedScript) && (
                            <button
                                className={clsx(styles.primaryButton)}
                                onClick={handleContinue}
                                disabled={segmentLoading}
                            >
                                {segmentLoading ? 'Đang xử lý...' : 'Tiếp tục'}
                            </button>
                        )}
                    </div>
                ) : (
                    <button className={clsx(styles.secondaryButton)} onClick={() => navigate('/literature')}>
                        Quay lại
                    </button>
                )}
            </div>

            {loading && (
                <div className={clsx(styles.spinner)}>
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            )}

            {segmentLoading && (
                <div className={clsx(styles.spinner)}>
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p>Đang tách kịch bản thành các phân đoạn...</p>
                </div>
            )}

            {error && <div className={clsx(styles.errorAlert)}>{error}</div>}

            {/* Hiển thị form cấu hình hoặc kịch bản */}
            {!loading && !error && configMode && renderConfigForm()}

            {!loading && !error && !configMode && !showSegments && (
                <>
                    <div className={clsx(styles.buttonGroup)}>
                        <button className={clsx(styles.secondaryButton)} onClick={() => setConfigMode(true)}>
                            Thay đổi cấu hình
                        </button>
                        <button
                            className={clsx(styles.successButton)}
                            onClick={handleSplitScript}
                            disabled={!script && !editedScript}
                        >
                            Tách thành phân đoạn
                        </button>
                        {scriptSegments.length > 0 && (
                            <button className={clsx(styles.infoButton)} onClick={() => setShowSegments(true)}>
                                Xem phân đoạn ({scriptSegments.length})
                            </button>
                        )}
                        <button className={clsx(styles.primaryButton)} onClick={handleCopy}>
                            Sao chép kịch bản
                        </button>
                    </div>
                    {editMode && (
                        <div className={clsx(styles.editSection)}>
                            <h4>Chỉnh sửa kịch bản</h4>
                            <div className={clsx(styles.formGroup)}>
                                <label htmlFor="editInstructions" className={clsx(styles.formLabel)}>
                                    Hướng dẫn chỉnh sửa:
                                </label>
                                <textarea
                                    id="editInstructions"
                                    className={clsx(styles.formControl)}
                                    rows={3}
                                    value={editInstructions}
                                    onChange={(e) => setEditInstructions(e.target.value)}
                                />
                            </div>
                            <button className={clsx(styles.primaryButton)} onClick={handleEdit}>
                                Áp dụng chỉnh sửa
                            </button>
                        </div>
                    )}
                    <div className={clsx(styles.card)}>
                        <div className={clsx(styles.cardHeader)}>
                            <h5 className={clsx(styles.cardTitle)}>Kịch bản đã tạo</h5>
                        </div>
                        <div className={clsx(styles.cardBody)}>
                            <pre className={clsx(styles.preWrap)}>{editedScript || script}</pre>
                        </div>
                    </div>
                </>
            )}

            {!loading && !error && !configMode && showSegments && renderScriptSegments()}
        </div>
    );
};

export default ScriptAutoGenerate;
