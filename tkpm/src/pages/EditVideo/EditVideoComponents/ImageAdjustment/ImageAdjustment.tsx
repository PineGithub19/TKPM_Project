import React from 'react';
import styles from '../../EditVideo.module.css';

type ImageAdjustmentProps = {
    brightness: number;
    handleBrightnessChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    contrast: number;
    handleContrastChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    exposure: number;
    handleExposureChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    temperature: number;
    handleTemperatureChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    saturation: number;
    handleSaturationChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    blur: number;
    handleBlurChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    vignette: number;
    handleVignetteChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    clarity: number;
    handleClarityChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

const ImageAdjustment: React.FC<ImageAdjustmentProps> = ({
    brightness,
    handleBrightnessChange,
    contrast,
    handleContrastChange,
    exposure,
    handleExposureChange,
    temperature,
    handleTemperatureChange,
    saturation,
    handleSaturationChange,
    blur,
    handleBlurChange,
    vignette,
    handleVignetteChange,
    clarity,
    handleClarityChange,
}) => (
    <div className={styles.soundAndSpeed}>
        <div className={styles.soundControl}>
            <img src="/iconBrightness.png" alt="Brightness Icon" className={styles.soundIcon} />
            <input
                type="range"
                min="0"
                max="100"
                value={brightness}
                onChange={handleBrightnessChange}
                className={styles.volumeSlider}
            />
        </div>
        <div className={styles.soundControl}>
            <img src="/iconContrast.png" alt="Contrast Icon" className={styles.soundIcon} />
            <input
                type="range"
                min="0"
                max="100"
                value={contrast}
                onChange={handleContrastChange}
                className={styles.volumeSlider}
            />
        </div>
        <div className={styles.soundControl}>
            <img src="/iconExposure.png" alt="Exposure Icon" className={styles.soundIcon} />
            <input
                type="range"
                min="0"
                max="100"
                value={exposure}
                onChange={handleExposureChange}
                className={styles.volumeSlider}
            />
        </div>
        <div className={styles.soundControl}>
            <img src="/iconTemperature.png" alt="Temperature Icon" className={styles.soundIcon} />
            <input
                type="range"
                min="0"
                max="100"
                value={temperature}
                onChange={handleTemperatureChange}
                className={styles.volumeSlider}
            />
        </div>
        <div className={styles.soundControl}>
            <img src="/iconSaturation.png" alt="Saturation Icon" className={styles.soundIcon} />
            <input
                type="range"
                min="0"
                max="100"
                value={saturation}
                onChange={handleSaturationChange}
                className={styles.volumeSlider}
            />
        </div>
        <div className={styles.soundControl}>
            <img src="/iconBlur.png" alt="Blur Icon" className={styles.soundIcon} />
            <input
                type="range"
                min="0"
                max="100"
                value={blur}
                onChange={handleBlurChange}
                className={styles.volumeSlider}
            />
        </div>
        <div className={styles.soundControl}>
            <img src="/iconVignette.png" alt="Vignette Icon" className={styles.soundIcon} />
            <input
                type="range"
                min="0"
                max="100"
                value={vignette}
                onChange={handleVignetteChange}
                className={styles.volumeSlider}
            />
        </div>
        <div className={styles.soundControl}>
            <img src="/iconClarity.png" alt="Clarity Icon" className={styles.soundIcon} />
            <input
                type="range"
                min="0"
                max="100"
                value={clarity}
                onChange={handleClarityChange}
                className={styles.volumeSlider}
            />
        </div>
    </div>
);

export default ImageAdjustment;
