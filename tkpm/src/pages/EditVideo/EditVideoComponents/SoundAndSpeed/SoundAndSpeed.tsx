import React from 'react';
import styles from '../../EditVideo.module.css';

type SoundAndSpeedProps = {
    volume: number;
    handleVolumeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    speed: number;
    handleSpeedChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

const SoundAndSpeed: React.FC<SoundAndSpeedProps> = ({ volume, handleVolumeChange, speed, handleSpeedChange }) => (
    <div className={styles.soundAndSpeed}>
        <div className={styles.soundControl}>
            <img src="/iconVolumn.png" alt="Listen Icon" className={styles.soundIcon} />
            <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={handleVolumeChange}
                className={styles.volumeSlider}
            />
        </div>
        <div className={styles.soundControl}>
            <img src="/iconSpeed.png" alt="Speed Icon" className={styles.soundIcon} />
            <input
                type="range"
                min="0"
                max="100"
                value={speed}
                onChange={handleSpeedChange}
                className={styles.volumeSlider}
            />
        </div>
    </div>
);

export default SoundAndSpeed;
