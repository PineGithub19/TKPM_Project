import React from 'react';
import { ImageConfig } from '../ImagesConfiguration';

interface StableDiffusionConfigurationProps {
    imageConfig: ImageConfig;
    generationType: 'static' | 'motion';
    onConfigChange: (key: keyof ImageConfig, value: number | string) => void;
}

const StableDiffusionConfiguration: React.FC<StableDiffusionConfigurationProps> = ({
    imageConfig,
    generationType,
    onConfigChange,
}) => {
    return (
        <div className="row g-3">
            {/* Common Settings */}
            <div className="col-md-6">
                <label className="form-label">Steps (1-150)</label>
                <input
                    type="number"
                    className="form-control"
                    value={imageConfig.steps}
                    min={1}
                    max={150}
                    onChange={(e) => onConfigChange('steps', parseInt(e.target.value))}
                />
            </div>
            <div className="col-md-6">
                <label className="form-label">Strictness (1-30)</label>
                <input
                    type="number"
                    className="form-control"
                    value={imageConfig.cfg_scale}
                    min={1}
                    max={30}
                    onChange={(e) => onConfigChange('cfg_scale', parseInt(e.target.value))}
                />
            </div>
            <div className="col-md-6">
                <label className="form-label">Style</label>
                <select
                    className="form-select"
                    value={imageConfig.model}
                    onChange={(e) => onConfigChange('model', e.target.value)}
                >
                    <option value="dreamshaper_8.safetensors">Reality</option>
                    <option value="toonyou_beta6.safetensors">Cartoon (Anime)</option>
                </select>
            </div>
            <div className="col-md-6">
                <label className="form-label">Sampler</label>
                <select
                    className="form-select"
                    value={imageConfig.sampler_name}
                    onChange={(e) => onConfigChange('sampler_name', e.target.value)}
                >
                    <option value="Euler a">Euler a (Recommended)</option>
                    <option value="Euler">Euler</option>
                    <option value="DPM++ 2M">DPM++ 2M</option>
                    <option value="DPM++ SDE">DPM++ SDE</option>
                    <option value="UniPC">UniPC</option>
                    <option value="DDIM">DDIM</option>
                </select>
            </div>
            {/* Static Image Settings */}
            {generationType === 'static' && (
                <div className="col-md-6">
                    <label className="form-label">The number of images (1-10)</label>
                    <input
                        type="number"
                        className="form-control"
                        value={imageConfig.batch_size}
                        min={1}
                        max={10}
                        onChange={(e) => onConfigChange('batch_size', parseInt(e.target.value))}
                    />
                </div>
            )}
            {/* Motion Image Settings */}
            {generationType === 'motion' && (
                <>
                    <div className="col-md-6">
                        <label className="form-label">Animation Speed (FPS)</label>
                        <input
                            type="number"
                            className="form-control"
                            value={imageConfig.fps}
                            min={6}
                            max={12}
                            onChange={(e) => onConfigChange('fps', parseInt(e.target.value))}
                        />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label">Animation Length (Frames)</label>
                        <input
                            type="number"
                            className="form-control"
                            value={imageConfig.video_length}
                            min={16}
                            max={32}
                            onChange={(e) => onConfigChange('video_length', parseInt(e.target.value))}
                        />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label">Motion Strength ({imageConfig.latent_power})</label>
                        <input
                            type="range"
                            className="form-range"
                            value={imageConfig.latent_power}
                            min={0.5}
                            max={2.0}
                            step={0.1}
                            onChange={(e) => onConfigChange('latent_power', parseFloat(e.target.value))}
                        />
                    </div>
                </>
            )}
        </div>
    );
};

export default StableDiffusionConfiguration;
