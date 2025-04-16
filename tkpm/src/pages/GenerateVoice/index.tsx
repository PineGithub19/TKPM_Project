// components/GenerateVoice.tsx
import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Button, message, Tabs, Card, Spin, Progress } from 'antd';
import { post } from '../../utils/request';
import styles from './GenerateVoice.module.css';

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
    promptId: string;
    scriptSegments?: string[];
    scriptTitle?: string;
    onComplete?: (voices: string[], segmentsScript: string[]) => void;
}

const GenerateVoice: React.FC<GenerateVoiceProps> = ({
    promptId = '',
    scriptSegments = [],
    scriptTitle = '',
    onComplete,
}) => {
    const [loading, setLoading] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('single');
    const [voiceSegments, setVoiceSegments] = useState<VoiceSegment[]>([]);
    const [currentTone, setCurrentTone] = useState<string>('formal');
    const [currentLanguage, setCurrentLanguage] = useState<string>('vi');
    const [batchProcessing, setBatchProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [translatedSegments, setTranslatedSegments] = useState<string[]>([]);

    useEffect(() => {
        const translateSegments = async () => {
            try {
                const response = await post('/script_generate/edit', {
                    originalScript: scriptSegments.join('\n\n'),
                    editInstructions: 'Translate to Vietnamese',
                });

                if (response.success) {
                    const translatedSegments = response.script.split('\n\n');
                    setTranslatedSegments(translatedSegments);
                    setVoiceSegments(
                        translatedSegments.map((text: string, index: number) => ({
                            text,
                            audioUrl: null,
                            status: 'idle',
                            index,
                        })),
                    );
                } else {
                    message.error('Failed to translate script segments.');
                }
            } catch (error) {
                console.log(error);
                message.error('Error translating script segments.');
            }
        };

        if (scriptSegments && scriptSegments.length > 0) {
            translateSegments();
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
                promptId: promptId,
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
            let list_voice: string[] = [];
            voiceSegments.forEach((voice) => {
                if (voice.status === 'success' && voice.audioUrl) list_voice.push(voice.audioUrl);
            });

            onComplete(list_voice, translatedSegments);
        }
    };

    const renderSingleVoiceGenerator = () => (
        <Form layout="vertical" onFinish={onFinish} className={styles.form}>
            <Form.Item
                name="text"
                rules={[{ required: true, message: 'Vui lòng nhập văn bản!' }]}
                className={styles.formItem}
            >
                <label className={styles.customLabel}>Văn bản</label>
                <Input.TextArea className={styles.textArea} placeholder="Nhập văn bản cần chuyển thành giọng nói" />
            </Form.Item>

            <Form.Item name="tone" initialValue="formal" className={styles.formItem}>
                <label className={styles.customLabel}>Giọng điệu</label>
                <Select className={styles.formSelect} placeholder="Chọn giọng điệu">
                    <Option className={styles.option} value="formal">
                        Trang trọng
                    </Option>
                    <Option className={styles.option} value="epic">
                        Hùng tráng
                    </Option>
                    <Option className={styles.option} value="humorous">
                        Hài hước
                    </Option>
                </Select>
            </Form.Item>

            <Form.Item name="language" initialValue="vi" className={styles.formItem}>
                <label className={styles.customLabel}>Ngôn ngữ</label>
                <Select className={styles.formSelect} placeholder="Chọn ngôn ngữ">
                    <Option className={styles.option} value="vi">
                        Tiếng Việt
                    </Option>
                    <Option className={styles.option} value="en">
                        Tiếng Anh
                    </Option>
                </Select>
            </Form.Item>

            <Form.Item className={styles.boxButton}>
                <Button type="primary" htmlType="submit" loading={loading} className={styles.button}>
                    Tạo Giọng Nói
                </Button>
            </Form.Item>

            {audioUrl && (
                <div className={styles.resultWrapper}>
                    <h2 className={styles.resultHeader}>Kết quả:</h2>
                    <div>
                        <p className={styles.resultText}>URL: {audioUrl}</p>
                        <a href={audioUrl} download className={styles.downloadLink}>
                            Tải xuống
                        </a>
                    </div>
                    <audio controls src={audioUrl} className={styles.audioControl}>
                        Trình duyệt của bạn không hỗ trợ phát audio.
                    </audio>
                </div>
            )}
        </Form>
    );

    const renderBatchVoiceGenerator = () => (
        <div className={styles.batchContainer}>
            <div>
                <h2 className={styles.batchHeader}>{scriptTitle || 'Tạo Giọng Nói Hàng Loạt'}</h2>
                <p className={styles.batchSubtitle}>Tạo giọng nói cho {voiceSegments.length} phân đoạn kịch bản</p>
            </div>

            <div className="row mb-4">
                <div className="col-md-6">
                    <label
                        style={{
                            fontSize: '20px',
                            fontWeight: '600',
                            marginBottom: '0.5rem',
                            display: 'inline-block',
                            marginRight: '10px',
                        }}
                    >
                        Giọng điệu:
                    </label>
                    <Select
                        className={styles.formSelect}
                        value={currentTone}
                        onChange={setCurrentTone}
                        disabled={batchProcessing}
                        placeholder="Chọn giọng điệu"
                    >
                        <Option className={styles.option} value="formal">
                            Trang trọng
                        </Option>
                        <Option className={styles.option} value="epic">
                            Hùng tráng
                        </Option>
                        <Option className={styles.option} value="humorous">
                            Hài hước
                        </Option>
                    </Select>
                </div>

                <div className="col-md-6">
                    <label
                        style={{ fontSize: '20px', fontWeight: '600', marginBottom: '0.5rem', display: 'inline-block' }}
                    >
                        Ngôn ngữ:
                    </label>
                    <Select
                        className={styles.formSelect}
                        value={currentLanguage}
                        onChange={setCurrentLanguage}
                        disabled={batchProcessing}
                        placeholder="Chọn ngôn ngữ"
                    >
                        <Option className={styles.option} value="vi">
                            Tiếng Việt
                        </Option>
                        <Option className={styles.option} value="en">
                            Tiếng Anh
                        </Option>
                    </Select>
                </div>
            </div>

            <div className={styles.batchControls} style={{ display: 'flex', alignContent: 'start !important' }}>
                <Button
                    type="primary"
                    size="large"
                    className={styles.generateAllButton}
                    onClick={generateAllVoices}
                    disabled={batchProcessing || voiceSegments.length === 0}
                >
                    Tạo Giọng Nói Cho Tất Cả Phân Đoạn
                </Button>
                {onComplete && (
                    <Button
                        type="default"
                        onClick={handleComplete}
                        size="large"
                        style={{
                            backgroundColor: '#D2691E',
                            color: 'white',
                            border: 'none',
                            padding: '23px 20px 23px 20px',
                            margin: '0 0 0 20px',
                            fontSize: '20px',
                            fontWeight: 'bold',
                        }}
                    >
                        Tiếp Tục
                    </Button>
                )}
                {batchProcessing && (
                    <div
                        className="row mb-4 progressBar"
                        style={{ margin: 0, padding: 0, width: '100%', display: 'flex', gap: 10 }}
                    >
                        <Progress
                            percent={progress}
                            status="active"
                            className={styles.progress}
                            style={{ width: '200px' }}
                        />
                        {/* <p className="text-center" style={{margin: 0}}>Đang xử lý phân đoạn...</p> */}
                    </div>
                )}
            </div>

            <div>
                {voiceSegments.map((segment, index) => (
                    <Card
                        key={index}
                        className={styles.segmentCard}
                        title={`Phân đoạn #${index + 1}`}
                        extra={
                            <Button
                                type="link"
                                onClick={() => generateVoiceForSegment(segment)}
                                disabled={segment.status === 'loading' || batchProcessing}
                                style={{
                                    color: 'white',
                                    backgroundColor: '#28A745',
                                    border: '2px solid #28A745',
                                    borderRadius: '8px',
                                    padding: '20px 20px',
                                    textDecoration: 'none',
                                    fontWeight: 'bold',
                                    fontSize: '20px',
                                }}
                            >
                                {segment.status === 'success' ? 'Tạo lại' : 'Tạo giọng nói'}
                            </Button>
                        }
                        style={{ padding: '0', border: '1px solid white' }}
                    >
                        {/* extra={<Button style={{ fontSize: 16, padding: '20px 30px 20px 30px', backgroundColor: '#ff6600', color: 'white', border: 'none', fontWeight: 'bold', textTransform: 'uppercase', boxShadow: 'none',}}>Chọn</Button>} */}
                        <div className={styles.segmentCardBody}>{segment.text}</div>

                        {segment.status === 'loading' && (
                            <div className="text-center py-3">
                                <Spin />
                                <p>Đang tạo giọng nói...</p>
                            </div>
                        )}

                        {segment.status === 'error' && (
                            <div className={styles.segmentCardError}>Lỗi khi tạo giọng nói. Vui lòng thử lại.</div>
                        )}

                        {segment.status === 'success' && segment.audioUrl && (
                            <div className={styles.segmentCardAudio}>
                                <audio controls src={segment.audioUrl} className="w-100 mb-2">
                                    Trình duyệt của bạn không hỗ trợ phát audio.
                                </audio>
                                <div className={styles.segmentCardDownload}>
                                    <a href={segment.audioUrl} download={`segment-${index + 1}.mp3`}>
                                        Tải xuống
                                    </a>
                                </div>
                            </div>
                        )}
                    </Card>
                ))}
            </div>
        </div>
    );

    return (
        <div className={styles.container}>
            <Tabs activeKey={activeTab} onChange={setActiveTab} className="custom-tabs">
                <TabPane tab="Tạo Đơn Lẻ" key="single" className="custom-tab-pane">
                    {renderSingleVoiceGenerator()}
                </TabPane>
                <TabPane tab="Tạo Hàng Loạt" key="batch" className="custom-tab-pane">
                    {renderBatchVoiceGenerator()}
                </TabPane>
            </Tabs>
        </div>
    );
};

export default GenerateVoice;
