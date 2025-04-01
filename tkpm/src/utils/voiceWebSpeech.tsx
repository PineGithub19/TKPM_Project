// utils/voiceUtils.ts
export interface VoiceOptions {
    language?: string;
    pitch?: number;
    rate?: number;
    volume?: number;
}

export function getAvailableVoices() {
    const voices = window.speechSynthesis.getVoices();
    return voices.map(voice => ({
        name: voice.name,
        language: voice.lang
    }));
}

export async function textToSpeech(text: string, options?: VoiceOptions): Promise<string> {
    return new Promise((resolve, reject) => {
        if (!('speechSynthesis' in window)) {
            reject(new Error('Trình duyệt không hỗ trợ Web Speech API'));
            return;
        }

        // Tạo đối tượng SpeechSynthesisUtterance
        const utterance = new SpeechSynthesisUtterance(text);

        // Cấu hình các thông số
        utterance.lang = options?.language || 'vi-VN';
        utterance.pitch = options?.pitch || 1;
        utterance.rate = options?.rate || 1;
        utterance.volume = options?.volume || 1;

        // Chọn giọng đọc
        const voices = window.speechSynthesis.getVoices();
        const vietnameseVoices = voices.filter(voice => 
            voice.lang.startsWith('vi') || voice.lang.startsWith('Vi')
        );

        if (vietnameseVoices.length > 0) {
            utterance.voice = vietnameseVoices[0];
        }

        // Tạo AudioContext và Analyser
        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);
        
        const audioData: Float32Array[] = [];

        scriptProcessor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            audioData.push(new Float32Array(inputData));
        };

        analyser.connect(scriptProcessor);
        scriptProcessor.connect(audioContext.destination);

        utterance.onend = () => {
            // Kết hợp tất cả dữ liệu âm thanh
            const combinedData = new Float32Array(audioData.reduce((acc, curr) => acc + curr.length, 0));
            let offset = 0;
            audioData.forEach(data => {
                combinedData.set(data, offset);
                offset += data.length;
            });

            // Tạo WAV file từ dữ liệu âm thanh
            const wavBlob = createWavBlob(combinedData, audioContext.sampleRate);
            const audioUrl = URL.createObjectURL(wavBlob);
            
            // Cleanup
            scriptProcessor.disconnect();
            analyser.disconnect();
            
            resolve(audioUrl);
        };

        utterance.onerror = (error) => {
            reject(error);
        };

        // Phát âm
        window.speechSynthesis.speak(utterance);
    });
}

// Hàm tạo WAV blob từ audio data
function createWavBlob(audioData: Float32Array, sampleRate: number): Blob {
    const buffer = new ArrayBuffer(44 + audioData.length * 2);
    const view = new DataView(buffer);

    // WAV Header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + audioData.length * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, audioData.length * 2, true);

    // Convert Float32Array to Int16Array
    const length = audioData.length;
    const index = 44;
    for (let i = 0; i < length; i++) {
        const s = Math.max(-1, Math.min(1, audioData[i]));
        view.setInt16(index + i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }

    return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

export function downloadAudio(audioUrl: string, filename: string = 'speech.wav') {
    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Hàm mới để tải trực tiếp Blob
export function downloadBlob(blob: Blob, filename: string = 'speech.wav') {
    // Tạo URL từ Blob
    const audioUrl = URL.createObjectURL(blob);
    
    // Tạo một liên kết tải xuống
    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = filename;
    
    // Thêm vào body, click và xóa đi
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Giải phóng bộ nhớ
    URL.revokeObjectURL(audioUrl);
}