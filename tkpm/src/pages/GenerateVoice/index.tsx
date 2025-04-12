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
        <Form layout="vertical" onFinish={() => {}} className={styles.form}>
          <Form.Item name="text" rules={[{ required: true, message: 'Vui lòng nhập văn bản!' }]} className={styles.formItem}>
            <label className={styles.customLabel}>Văn bản</label>
            <Input.TextArea className={styles.textArea} placeholder="Nhập văn bản cần chuyển thành giọng nói" />
          </Form.Item>
    
          <Form.Item name="tone" initialValue="formal" className={styles.formItem}>
            <label className={styles.customLabel}>Giọng điệu</label>
            <Select className={styles.formSelect} placeholder="Chọn giọng điệu">
              <Option className={styles.option} value="formal">Trang trọng</Option>
              <Option className={styles.option} value="epic">Hùng tráng</Option>
              <Option className={styles.option} value="humorous">Hài hước</Option>
            </Select>
          </Form.Item>
    
          <Form.Item name="language" initialValue="vi" className={styles.formItem}>
            <label className={styles.customLabel}>Ngôn ngữ</label>
            <Select className={styles.formSelect} placeholder="Chọn ngôn ngữ">
              <Option className={styles.option} value="vi">Tiếng Việt</Option>
              <Option className={styles.option} value="en">Tiếng Anh</Option>
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
        <h2 className={styles.batchHeader}>Tạo Giọng Nói Hàng Loạt</h2>
        <p className={styles.batchSubtitle}>Tạo giọng nói cho {voiceSegments.length} phân đoạn kịch bản</p>

        <div className={styles.batchControls}>
        <Button type="primary" size="large" disabled={loading || voiceSegments.length === 0}>
            Tạo Giọng Nói Cho Tất Cả Phân Đoạn
        </Button>

        {loading && <Progress percent={progress} status="active" className={styles.progress} />}
        </div>

        <div>
        {voiceSegments.map((segment, index) => (
            <Card key={index} className={styles.segmentCard} title={`Phân đoạn #${index + 1}`} extra={<Button>Chọn</Button>}>
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
                <audio controls src={segment.audioUrl} />
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
<Tabs
  activeKey={activeTab}
  onChange={setActiveTab}
  className="custom-tabs"
>
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
