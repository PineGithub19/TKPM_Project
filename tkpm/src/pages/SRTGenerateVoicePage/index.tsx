// pages/SRTVoice/index.tsx
import React from 'react';
import SRTVoiceGenerator from '../../components/SRTVoiceGenerate';

const SRTVoicePage: React.FC = () => {
  return (
    <div className="container">
      <div className="row">
        <div className="col-12">
          <h1 className="mb-4">Tạo Giọng Nói Từ File SRT</h1>
          <p className="mb-4">
            Công cụ này giúp bạn tạo file âm thanh từ file phụ đề SRT với thời lượng chính xác theo thời gian phụ đề.
          </p>
          <SRTVoiceGenerator />
        </div>
      </div>
    </div>
  );
};

export default SRTVoicePage;