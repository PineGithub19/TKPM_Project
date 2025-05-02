import React, { useState } from 'react';
import StableDiffusionConfiguration from '../StableDiffusionConfiguration/StableDiffusionConfiguration';
import './ImagesConfiguration.module.css';

export interface ImageConfig {
    steps: number;
    width: number;
    height: number;
    cfg_scale: number;
    seed: number;
    sampler_name: string;
    batch_size: number;
    model: string;
    fps: number;
    video_length: number;
    loop_number: number;
    latent_power: number;
}

interface ImagesConfigurationProps {
    onConfigChange?: (config: {
        imageConfig: ImageConfig;
        generationType: 'static' | 'motion';
        modelAIType: 'gemini' | 'stable_diffusion';
    }) => void;
}

const ImagesConfiguration: React.FC<ImagesConfigurationProps> = ({ onConfigChange }) => {
    const [imageConfig, setImageConfig] = useState<ImageConfig>({
        steps: 10,
        width: 256,
        height: 256,
        cfg_scale: 7,
        seed: -1,
        sampler_name: 'Euler a',
        batch_size: 2,
        model: 'dreamshaper_8.safetensors',
        fps: 8,
        video_length: 16,
        loop_number: 0,
        latent_power: 1,
    });
    const [generationType, setGenerationType] = useState<'static' | 'motion'>('static');
    const [modelAIType, setModelAIType] = useState<'gemini' | 'stable_diffusion'>('gemini');

    const handleConfigChange = (key: keyof ImageConfig, value: number | string) => {
        setImageConfig((prev) => {
            const updated = { ...prev, [key]: value };
            if (onConfigChange) {
                onConfigChange({ imageConfig: updated, generationType, modelAIType });
            }
            return updated;
        });
    };

    const handleGenerationTypeChange = (type: 'static' | 'motion') => {
        setGenerationType(type);

        if (type === 'motion') setModelAIType('stable_diffusion');

        if (onConfigChange) {
            onConfigChange({ imageConfig, generationType: type, modelAIType });
        }
    };

    const handleModelAITypeChange = (type: 'gemini' | 'stable_diffusion') => {
        setModelAIType(type);
        if (onConfigChange) {
            onConfigChange({ imageConfig, generationType, modelAIType: type });
        }
    };

    return (
        <div className="p-4">
            <div className="container">
                <h3 className="mb-4">Chọn loại ảnh</h3>
                <div className="mb-4">
                    <div className="d-flex gap-3">
                        <div className="form-check">
                            <input
                                className="form-check-input"
                                type="radio"
                                name="generationType"
                                id="staticType"
                                checked={generationType === 'static'}
                                onChange={() => handleGenerationTypeChange('static')}
                            />
                            <label className="form-check-label text-white fs-5" htmlFor="staticType">
                                Static Image
                            </label>
                        </div>
                        <div className="form-check">
                            <input
                                className="form-check-input"
                                type="radio"
                                name="generationType"
                                id="motionType"
                                checked={generationType === 'motion'}
                                onChange={() => handleGenerationTypeChange('motion')}
                            />
                            <label className="form-check-label text-white fs-5" htmlFor="motionType">
                                Motion Image (GIF)
                            </label>
                        </div>
                    </div>
                </div>
                <div className="mb-4">
                    <h3 className="mb-4">Chọn mô hình AI</h3>
                    <div className="d-flex gap-3">
                        {generationType === 'static' && (
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="radio"
                                    name="modelAIType"
                                    id="geminiType"
                                    checked={modelAIType === 'gemini'}
                                    onChange={() => handleModelAITypeChange('gemini')}
                                />
                                <label className="form-check-label text-white fs-5" htmlFor="geminiType">
                                    Gemini
                                </label>
                            </div>
                        )}
                        <div className="form-check">
                            <input
                                className="form-check-input"
                                type="radio"
                                name="modelAIType"
                                id="stableDiffusionType"
                                checked={modelAIType === 'stable_diffusion'}
                                onChange={() => handleModelAITypeChange('stable_diffusion')}
                            />
                            <label className="form-check-label text-white fs-5" htmlFor="stableDiffusionType">
                                Stable Diffusion
                            </label>
                        </div>
                    </div>
                </div>
                {/* Model-specific configuration */}
                {modelAIType === 'stable_diffusion' && (
                    <StableDiffusionConfiguration
                        imageConfig={imageConfig}
                        generationType={generationType}
                        onConfigChange={handleConfigChange}
                    />
                )}
                {modelAIType === 'gemini' && generationType === 'static' && (
                    <div className="alert alert-info">Cấu hình cho mô hình Gemini chưa có sẵn.</div>
                )}
            </div>
        </div>
    );
};

export default ImagesConfiguration;
