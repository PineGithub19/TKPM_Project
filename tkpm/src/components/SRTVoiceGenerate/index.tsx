// components/SRTVoiceGenerator.tsx
import React, { useState} from 'react';
import { Form,  Select, Button, message, Upload, Card, Spin, Progress, Table } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { post } from '../../utils/request';

const { Option } = Select;

interface SRTSegment {
  id: number;
  startTime: string;
  endTime: string;
  duration: number; // in milliseconds
  text: string;
  audioUrl: string | null;
  status: 'idle' | 'loading' | 'success' | 'error';
}

interface SRTVoiceGeneratorProps {
  onComplete?: () => void;
}

const SRTVoiceGenerator: React.FC<SRTVoiceGeneratorProps> = ({ onComplete }) => {
  const [srtSegments, setSrtSegments] = useState<SRTSegment[]>([]);
//   const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTone, setCurrentTone] = useState<string>('formal');
  const [currentLanguage, setCurrentLanguage] = useState<string>('vi');

  const parseSRT = (srtContent: string): SRTSegment[] => {
    const segments: SRTSegment[] = [];
    const pattern = /(\d+)\r?\n(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})\r?\n([\s\S]*?)(?=\r?\n\r?\n\d+\r?\n|$)/g;
    
    let match;
    while ((match = pattern.exec(srtContent)) !== null) {
      const id = parseInt(match[1]);
      const startTime = match[2];
      const endTime = match[3];
      const text = match[4].trim().replace(/\r?\n/g, ' ');
      
      // Calculate duration in milliseconds
      const duration = timeToMs(endTime) - timeToMs(startTime);
      
      segments.push({
        id,
        startTime,
        endTime,
        duration,
        text,
        audioUrl: null,
        status: 'idle'
      });
    }
    
    return segments;
  };

  const timeToMs = (timeString: string): number => {
    const [hours, minutes, secondsMs] = timeString.split(':');
    const [seconds, ms] = secondsMs.split(',');
    
    return (
      parseInt(hours) * 3600000 +
      parseInt(minutes) * 60000 +
      parseInt(seconds) * 1000 +
      parseInt(ms)
    );
  };

//   const msToTimeString = (ms: number): string => {
//     const hours = Math.floor(ms / 3600000);
//     const minutes = Math.floor((ms % 3600000) / 60000);
//     const seconds = Math.floor((ms % 60000) / 1000);
//     const milliseconds = ms % 1000;
    
//     return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`;
//   };

  const handleSRTUpload = (info: any) => {
    setUploading(true);
    const { fileList } = info;
    
    if (fileList.length > 0) {
      const file = fileList[0].originFileObj;
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const srtContent = e.target?.result as string;
        const parsedSegments = parseSRT(srtContent);
        setSrtSegments(parsedSegments);
        setUploading(false);
        
        if (parsedSegments.length > 0) {
          message.success(`${parsedSegments.length} phân đoạn đã được phân tích thành công.`);
        } else {
          message.error('Không thể phân tích file SRT. Vui lòng kiểm tra định dạng.');
        }
      };
      
      reader.onerror = () => {
        setUploading(false);
        message.error('Lỗi khi đọc file.');
      };
      
      reader.readAsText(file);
    }
  };

  const generateVoiceForSegment = async (segment: SRTSegment) => {
    try {
      // Update segment status to loading
      setSrtSegments((prev) => prev.map((s) => (s.id === segment.id ? { ...s, status: 'loading' } : s)));

      const response = await post('/voice/generate-srt', {
        text: segment.text,
        tone: currentTone,
        language: currentLanguage,
        duration: segment.duration, // Send duration to backend
      });

      if (response.success) {
        // Update segment with audio URL
        setSrtSegments((prev) =>
          prev.map((s) =>
            s.id === segment.id
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
        throw new Error(response.error || 'Lỗi tạo giọng nói');
      }
    } catch (error: any) {
      // Update segment status to error
      setSrtSegments((prev) => 
        prev.map((s) => (s.id === segment.id ? { ...s, status: 'error', audioUrl: null } : s))
      );
      message.error(error.message || 'Lỗi khi tạo giọng nói cho phân đoạn');
      return false;
    }
  };

  const generateAllVoices = async () => {
    setBatchProcessing(true);
    setProgress(0);

    let successCount = 0;
    const totalSegments = srtSegments.length;

    for (let i = 0; i < srtSegments.length; i++) {
      const segment = srtSegments[i];
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

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: 'Thời gian bắt đầu',
      dataIndex: 'startTime',
      key: 'startTime',
      width: 120,
    },
    {
      title: 'Thời gian kết thúc',
      dataIndex: 'endTime',
      key: 'endTime',
      width: 120,
    },
    {
      title: 'Thời lượng',
      key: 'duration',
      width: 100,
      render: (_: unknown, record: SRTSegment) => `${(record.duration / 1000).toFixed(2)}s`,
    },
    {
      title: 'Nội dung',
      dataIndex: 'text',
      key: 'text',
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 120,
      render: (_: unknown, record: SRTSegment) => {
        if (record.status === 'loading') {
          return <Spin size="small" />;
        } else if (record.status === 'success') {
          return <span className="text-success">Thành công</span>;
        } else if (record.status === 'error') {
          return <span className="text-danger">Lỗi</span>;
        }
        return <span>Chưa xử lý</span>;
      },
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 200,
      render: (_: unknown, record: SRTSegment) => (
        <div>
          <Button
            type="primary"
            size="small"
            onClick={() => generateVoiceForSegment(record)}
            disabled={record.status === 'loading' || batchProcessing}
            className="mr-2"
          >
            {record.status === 'success' ? 'Tạo lại' : 'Tạo giọng nói'}
          </Button>
          
          {record.audioUrl && (
            <div className="mt-2">
              <audio controls src={record.audioUrl} className="w-full mb-2">
                Trình duyệt của bạn không hỗ trợ phát audio.
              </audio>
              <div className="text-right">
                <a
                  href={record.audioUrl}
                  download={`segment_${record.id}.mp3`}
                  className="btn btn-sm btn-outline-primary"
                >
                  Tải xuống
                </a>
              </div>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-4">
      <Card title="Tạo giọng nói từ file SRT" className="mb-4">
        <Form layout="vertical">
          <Form.Item label="Tải lên file SRT">
            <Upload
              beforeUpload={() => false}
              onChange={handleSRTUpload}
              maxCount={1}
              accept=".srt"
              showUploadList={false}
            >
              <Button icon={<UploadOutlined />} loading={uploading}>
                Chọn file SRT
              </Button>
            </Upload>
          </Form.Item>

          <div className="row mb-3">
            <div className="col-md-6">
              <Form.Item label="Giọng điệu">
                <Select
                  value={currentTone}
                  onChange={setCurrentTone}
                  disabled={batchProcessing}
                >
                  <Option value="formal">Trang trọng</Option>
                  <Option value="epic">Hùng tráng</Option>
                  <Option value="humorous">Hài hước</Option>
                </Select>
              </Form.Item>
            </div>

            <div className="col-md-6">
              <Form.Item label="Ngôn ngữ">
                <Select
                  value={currentLanguage}
                  onChange={setCurrentLanguage}
                  disabled={batchProcessing}
                >
                  <Option value="vi">Tiếng Việt</Option>
                  <Option value="en">Tiếng Anh</Option>
                </Select>
              </Form.Item>
            </div>
          </div>

          <div className="d-flex justify-content-between">
            <Button
              type="primary"
              onClick={generateAllVoices}
              disabled={batchProcessing || srtSegments.length === 0}
            >
              Tạo giọng nói cho tất cả phân đoạn
            </Button>

            {onComplete && (
              <Button onClick={handleComplete}>
                Hoàn thành
              </Button>
            )}
          </div>
        </Form>

        {batchProcessing && (
          <div className="mt-4">
            <Progress percent={progress} status="active" />
            <p className="text-center">Đang xử lý phân đoạn...</p>
          </div>
        )}
      </Card>

      {srtSegments.length > 0 && (
        <Card title={`Phân đoạn (${srtSegments.length})`}>
          <Table
            columns={columns}
            dataSource={srtSegments}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            scroll={{ x: 1200 }}
          />
        </Card>
      )}
    </div>
  );
};

export default SRTVoiceGenerator;