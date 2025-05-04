// components/GenerateVoice.tsx
import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Button, message, Tabs, Card, Spin, Progress } from 'antd';
import { post } from '../../utils/request';
import styles from './GenerateVoice.module.css';
import { VoiceRecorder } from '../../components/RecordVoice';
import clsx from 'clsx';
import LoadingComponent from '../../components/Loading';

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
    isRecorded?: boolean; // Thêm trường để đánh dấu segment được ghi âm
}

interface GenerateVoiceProps {
    promptId: string;
    scriptSegments?: string[];
    scriptTitle?: string;
    voicesList?: string[];
    onComplete?: (voices: string[], segmentsScript: string[]) => void;
}

const GenerateVoice: React.FC<GenerateVoiceProps> = ({
    promptId = '',
    scriptSegments = [],
    scriptTitle = '',
    voicesList = [],
    onComplete,
}) => {
    useEffect(() => {
        console.log('Prompt ID:', promptId);
        console.log('Script Segments:', scriptSegments);
        console.log('Script Title:', scriptTitle);
        console.log('voice list: ', voicesList);
    }, [promptId, scriptSegments, scriptTitle, voicesList]);

    const [isTranslating, setIsTranslating] = useState(false);

    const [loading, setLoading] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('single');
    const [voiceSegments, setVoiceSegments] = useState<VoiceSegment[]>([]);
    const [currentTone, setCurrentTone] = useState<string>('formal');
    const [currentLanguage, setCurrentLanguage] = useState<string>('vi');
    const [batchProcessing, setBatchProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [translatedSegments, setTranslatedSegments] = useState<string[]>([]);

    const [recordingMode, setRecordingMode] = useState(false); // State để kiểm soát chế độ ghi âm
    const [selectedSegmentIndex, setSelectedSegmentIndex] = useState<number | null>(null); // Segment đang được chọn để ghi âm

    useEffect(() => {
        const translateSegments = async () => {
            try {
                if (currentLanguage === 'vi') {
                    // Nếu là tiếng Việt, không cần dịch, chỉ set lại voiceSegments
                    setVoiceSegments(
                        scriptSegments.map((text: string, index: number) => ({
                            text,
                            audioUrl: null,
                            status: 'idle',
                            index,
                        })),
                    );
                    return;
                }

                setIsTranslating(true);

                const response = await post('/script_generate/edit', {
                    originalScript: scriptSegments.join('\n\n'),
                    editInstructions: `Translate to ${currentLanguage}`,
                });

                if (response.success) {
                    const translatedSegments = response.script.split('\n\n');
                    setTranslatedSegments(translatedSegments);

                    const segmentFromThird = translatedSegments.slice(2);

                    // Nếu không có voicesList, sử dụng translatedSegments để tạo voiceSegments
                    if (!voicesList || voicesList.length === 0) {
                        setVoiceSegments(
                            segmentFromThird.map((text: string, index: number) => ({
                                text,
                                audioUrl: null,
                                status: 'idle',
                                index,
                            })),
                        );
                    }
                } else {
                    message.error('Failed to translate script segments.');
                }
            } catch (error) {
                console.log(error);
                message.error('Error translating script segments.');
            } finally {
                setIsTranslating(false);
            }
        };

        // Nếu có voicesList, sử dụng nó để tạo voiceSegments với text từ scriptSegments
        if (voicesList && voicesList.length > 0 && scriptSegments && scriptSegments.length > 0) {
            setVoiceSegments(
                voicesList.map((audioUrl: string, index: number) => ({
                    text: index < scriptSegments.length ? scriptSegments[index] : '',
                    audioUrl: audioUrl,
                    status: 'success',
                    index,
                })),
            );
        }
        // Nếu chỉ có scriptSegments mà không có voicesList
        else if (scriptSegments && scriptSegments.length > 0) {
            translateSegments();
        }
    }, [scriptSegments, voicesList, currentLanguage]);

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
                                  isRecorded: false,
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
            // Bỏ qua những segment đã được ghi âm
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
            const list_voice: string[] = [];
            voiceSegments.forEach((voice) => {
                if (voice.status === 'success' && voice.audioUrl) list_voice.push(voice.audioUrl);
            });
            if (translatedSegments.length > 0) {
                onComplete(list_voice, translatedSegments);
            }else {
                onComplete(list_voice, scriptSegments);
            }
        }
    };

    // Hàm xử lý khi nhận được bản ghi âm từ VoiceRecorder
    const handleRecordingComplete = async (recordingUrl: string, blob: Blob) => {
        if (selectedSegmentIndex !== null) {
            try {
                // Tạo FormData để gửi blob lên server
                const formData = new FormData();
                formData.append('voice', blob, `recording_${Date.now()}.mp3`);
                
                // Upload file lên server
                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/voice/upload`, {
                    method: 'POST',
                    body: formData,
                });
                
                const result = await response.json();
                
                if (result.success) {
                    // Sử dụng đường dẫn từ server thay vì blob URL
                    const serverAudioUrl = `${import.meta.env.VITE_BACKEND_URL}${result.path}`;
                    
                    setVoiceSegments((prev) =>
                        prev.map((s) =>
                            s.index === selectedSegmentIndex
                                ? {
                                      ...s,
                                      audioUrl: serverAudioUrl,
                                      status: 'success',
                                      isRecorded: true,
                                  }
                                : s,
                        ),
                    );
                    setRecordingMode(false);
                    setSelectedSegmentIndex(null);
                    message.success('Đã thêm bản ghi âm vào phân đoạn!');
                } else {
                    throw new Error('Không thể tải lên bản ghi âm');
                }
            } catch (error) {
                console.error('Error uploading recording:', error);
                message.error('Không thể lưu bản ghi âm vào server!');
            }
        }
    };

    // Hàm xử lý khi người dùng chọn ghi âm cho một phân đoạn
    const startRecordingForSegment = (segmentIndex: number) => {
        setSelectedSegmentIndex(segmentIndex);
        setRecordingMode(true);
    };

    // Hàm xử lý khi người dùng hủy ghi âm
    const cancelRecording = () => {
        setRecordingMode(false);
        setSelectedSegmentIndex(null);
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
                            <div className={styles.segmentCardButtons}>
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
                                        marginRight: '10px',
                                    }}
                                >
                                    {segment.status === 'success' && !segment.isRecorded ? 'Tạo lại' : 'Tạo giọng nói'}
                                </Button>
                                <Button
                                    type="link"
                                    onClick={() => startRecordingForSegment(index)}
                                    disabled={segment.status === 'loading' || batchProcessing}
                                    style={{
                                        color: 'white',
                                        backgroundColor: '#007BFF',
                                        border: '2px solid #007BFF',
                                        borderRadius: '8px',
                                        padding: '20px 20px',
                                        textDecoration: 'none',
                                        fontWeight: 'bold',
                                        fontSize: '20px',
                                    }}
                                >
                                    {segment.status === 'success' && segment.isRecorded ? 'Ghi âm lại' : 'Ghi âm'}
                                </Button>
                            </div>
                        }
                        style={{ padding: '0', border: '1px solid white' }}
                    >
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
                                {segment.isRecorded && <div className={styles.recordBadge}>Đã ghi âm</div>}
                            </div>
                        )}

                        {/* Show the recorder component directly under this segment if it's selected */}
                        {recordingMode && selectedSegmentIndex === index && (
                            <div className={styles.recorderContainer}>
                                <Card className={styles.recorderCard}>
                                    <h3 className={styles.recorderTitle}>
                                        Ghi âm cho phân đoạn #{index + 1}
                                    </h3>
                                    <p className={styles.recorderText}>{segment.text}</p>
                                    <VoiceRecorder onRecordingComplete={handleRecordingComplete} singleRecordingMode={true} />
                                    <Button onClick={cancelRecording} className={styles.cancelButton}>
                                        Hủy ghi âm
                                    </Button>
                                </Card>
                            </div>
                        )}
                    </Card>
                ))}
            </div>
        </div>
    );

    return (
        <div className={styles.container}>
            {isTranslating && (
                <LoadingComponent
                    customClassName={clsx('position-absolute', 'top-50', 'start-50')}
                    description="Đang dịch kịch bản..."
                    isOverlay={isTranslating}
                />
            )}
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
