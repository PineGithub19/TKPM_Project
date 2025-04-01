// components/GenerateVoice.tsx
import React, { useState } from 'react';
import { Form, Input, Select, Button, message } from 'antd';
import { post } from '../../utils/request';

const { Option } = Select;

interface VoiceGenerationForm extends Record<string, unknown> {
  text: string;
  tone?: 'formal' | 'epic' | 'humorous';
  language?: string;
}

const GenerateVoice: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

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

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Tạo Giọng Nói</h1>
      
      <Form
        layout="vertical"
        onFinish={onFinish}
        className="max-w-2xl"
      >
        <Form.Item
          label="Văn bản"
          name="text"
          rules={[{ required: true, message: 'Vui lòng nhập văn bản!' }]}
        >
          <Input.TextArea rows={4} placeholder="Nhập văn bản cần chuyển thành giọng nói" />
        </Form.Item>

        <Form.Item
          label="Giọng điệu"
          name="tone"
        >
          <Select placeholder="Chọn giọng điệu">
            <Option value="formal">Trang trọng</Option>
            <Option value="epic">Hùng tráng</Option>
            <Option value="humorous">Hài hước</Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="Ngôn ngữ"
          name="language"
          initialValue="vi"
        >
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
      </Form>

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
    </div>
  );
};

export default GenerateVoice;