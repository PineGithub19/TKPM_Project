// components/GenerateVoice.tsx
import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Button, message, Tabs, Card, Spin, Progress } from 'antd';
import { post } from '../../utils/request';

const { Option } = Select;
const { TabPane } = Tabs;

interface VoiceGenerationForm extends Record<string, unknown> {
    text: string;
    tone?: 'formal' | 'epic' | 'humorous';
    language?: string;
}

interface VoiceSegment {
    text: string;
    audioUrl: string | null;
    status: 'idle' | 'loading' | 'success' | 'error';
    index: number;
}

interface GenerateVoiceProps {
    scriptSegments?: string[];
    scriptTitle?: string;
    onComplete?: () => void;
}

const GenerateVoice: React.FC<GenerateVoiceProps> = ({ scriptSegments = [], scriptTitle = '', onComplete }) => {
    const [loading, setLoading] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('single');
    const [voiceSegments, setVoiceSegments] = useState<VoiceSegment[]>([]);
    const [currentTone, setCurrentTone] = useState<string>('formal');
    const [currentLanguage, setCurrentLanguage] = useState<string>('vi');
    const [batchProcessing, setBatchProcessing] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Initialize voice segments from script segments
        if (scriptSegments && scriptSegments.length > 0) {
            setActiveTab('batch');
            setVoiceSegments(
                scriptSegments.map((text, index) => ({
                    text,
                    audioUrl: null,
                    status: 'idle',
                    index,
                })),
            );
        }
    }, [scriptSegments]);

    const onFinish = async (values: VoiceGenerationForm) => {
        try {
            setLoading(true);
            const response = await post('/voice/generate', values);

            if (response.success) {
                setAudioUrl(`${import.meta.env.VITE_BACKEND_URL}${response.path}`);
                message.success('Tạo giọng nói thành công!');
            }
        } catch (error: any) {
            message.error(error.response?.data?.error || 'Có lỗi xảy ra khi tạo giọng nói');
        } finally {
            setLoading(false);
        }
    };

    const generateVoiceForSegment = async (segment: VoiceSegment) => {
        try {
            // Update segment status to loading
            setVoiceSegments((prev) => prev.map((s) => (s.index === segment.index ? { ...s, status: 'loading' } : s)));

            const response = await post('/voice/generate', {
                text: segment.text,
                tone: currentTone,
                language: currentLanguage,
            });

            if (response.success) {
                // Update segment with audio URL
                setVoiceSegments((prev) =>
                    prev.map((s) =>
                        s.index === segment.index
                            ? {
                                  ...s,
                                  audioUrl: `${import.meta.env.VITE_BACKEND_URL}${response.path}`,
                                  status: 'success',
                              }
                            : s,
                    ),
                );
                return true;
            } else {
                throw new Error('Lỗi tạo giọng nói');
            }
        } catch (error) {
            // Update segment status to error
            setVoiceSegments((prev) => prev.map((s) => (s.index === segment.index ? { ...s, status: 'error' } : s)));
            return false;
        }
    };

    const generateAllVoices = async () => {
        setBatchProcessing(true);
        setProgress(0);

        let successCount = 0;
        const totalSegments = voiceSegments.length;

        for (let i = 0; i < voiceSegments.length; i++) {
            const segment = voiceSegments[i];
            if (segment.status !== 'success') {
                const success = await generateVoiceForSegment(segment);
                if (success) successCount++;
            } else {
                successCount++;
            }

            // Update progress
            setProgress(Math.floor(((i + 1) * 100) / totalSegments));
        }

        setBatchProcessing(false);

        if (successCount === totalSegments) {
            message.success('Đã tạo giọng nói cho tất cả phân đoạn!');
        } else {
            message.warning(`Đã tạo được ${successCount}/${totalSegments} phân đoạn.`);
        }
    };

    const handleComplete = () => {
        if (onComplete) {
            onComplete();
        }
    };

    const renderSingleVoiceGenerator = () => (
        <Form layout="vertical" onFinish={onFinish} className="max-w-2xl">
            <Form.Item label="Văn bản" name="text" rules={[{ required: true, message: 'Vui lòng nhập văn bản!' }]}>
                <Input.TextArea rows={4} placeholder="Nhập văn bản cần chuyển thành giọng nói" />
            </Form.Item>

            <Form.Item label="Giọng điệu" name="tone" initialValue="formal">
                <Select placeholder="Chọn giọng điệu">
                    <Option value="formal">Trang trọng</Option>
                    <Option value="epic">Hùng tráng</Option>
                    <Option value="humorous">Hài hước</Option>
                </Select>
            </Form.Item>

            <Form.Item label="Ngôn ngữ" name="language" initialValue="vi">
                <Select>
                    <Option value="vi">Tiếng Việt</Option>
                    <Option value="en">Tiếng Anh</Option>
                </Select>
            </Form.Item>

            <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                    Tạo Giọng Nói
                </Button>
            </Form.Item>

            {audioUrl && (
                <div className="mt-6">
                    <h2 className="text-xl font-semibold mb-2">Kết quả:</h2>
                    <div className="mb-4">
                        <p className="text-sm text-gray-600">URL: {audioUrl}</p>
                        <a
                            href={audioUrl}
                            download
                            className="inline-block mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            Tải xuống
                        </a>
                    </div>
                    <audio controls src={audioUrl} className="w-full">
                        Trình duyệt của bạn không hỗ trợ phát audio.
                    </audio>
                </div>
            )}
        </Form>
    );

    const renderBatchVoiceGenerator = () => (
        <div className="batch-voice-generator">
            <div className="mb-4">
                <h2 className="text-xl font-bold mb-2">{scriptTitle || 'Tạo Giọng Nói Hàng Loạt'}</h2>
                <p className="text-sm text-gray-600 mb-4">
                    Tạo giọng nói cho {voiceSegments.length} phân đoạn kịch bản
                </p>

                <div className="batch-controls mb-4">
                    <div className="row mb-3">
                        <div className="col-md-6">
                            <label className="form-label">Giọng điệu:</label>
                            <Select
                                className="w-100"
                                value={currentTone}
                                onChange={setCurrentTone}
                                disabled={batchProcessing}
                            >
                                <Option value="formal">Trang trọng</Option>
                                <Option value="epic">Hùng tráng</Option>
                                <Option value="humorous">Hài hước</Option>
                            </Select>
                        </div>

                        <div className="col-md-6">
                            <label className="form-label">Ngôn ngữ:</label>
                            <Select
                                className="w-100"
                                value={currentLanguage}
                                onChange={setCurrentLanguage}
                                disabled={batchProcessing}
                            >
                                <Option value="vi">Tiếng Việt</Option>
                                <Option value="en">Tiếng Anh</Option>
                            </Select>
                        </div>
                    </div>

                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <Button
                            type="primary"
                            onClick={generateAllVoices}
                            disabled={batchProcessing || voiceSegments.length === 0}
                            size="large"
                        >
                            Tạo Giọng Nói Cho Tất Cả Phân Đoạn
                        </Button>

                        {onComplete && (
                            <Button type="default" onClick={handleComplete} size="large">
                                Tiếp Tục
                            </Button>
                        )}
                    </div>

                    {batchProcessing && (
                        <div className="mb-4">
                            <Progress percent={progress} status="active" />
                            <p className="text-center">Đang xử lý phân đoạn...</p>
                        </div>
                    )}
                </div>

                <div className="segments-list">
                    {voiceSegments.map((segment, index) => (
                        <Card
                            key={index}
                            className="mb-3"
                            title={`Phân đoạn #${index + 1}`}
                            extra={
                                <Button
                                    type="link"
                                    onClick={() => generateVoiceForSegment(segment)}
                                    disabled={segment.status === 'loading' || batchProcessing}
                                >
                                    {segment.status === 'success' ? 'Tạo lại' : 'Tạo giọng nói'}
                                </Button>
                            }
                        >
                            <p className="mb-3">{segment.text}</p>

                            {segment.status === 'loading' && (
                                <div className="text-center py-3">
                                    <Spin />
                                    <p className="mt-2">Đang tạo giọng nói...</p>
                                </div>
                            )}

                            {segment.status === 'error' && (
                                <div className="py-2 text-danger">Lỗi khi tạo giọng nói. Vui lòng thử lại.</div>
                            )}

                            {segment.status === 'success' && segment.audioUrl && (
                                <div className="py-2">
                                    <audio controls src={segment.audioUrl} className="w-100 mb-2">
                                        Trình duyệt của bạn không hỗ trợ phát audio.
                                    </audio>
                                    <div className="text-right">
                                        <a
                                            href={segment.audioUrl}
                                            download={`segment-${index + 1}.mp3`}
                                            className="btn btn-sm btn-outline-primary"
                                        >
                                            Tải xuống
                                        </a>
                                    </div>
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <div className="p-4">
            <Tabs activeKey={activeTab} onChange={setActiveTab}>
                <TabPane tab="Tạo Đơn Lẻ" key="single">
                    {renderSingleVoiceGenerator()}
                </TabPane>
                <TabPane tab="Tạo Hàng Loạt" key="batch">
                    {renderBatchVoiceGenerator()}
                </TabPane>
            </Tabs>
        </div>
    );
};

export default GenerateVoice;
