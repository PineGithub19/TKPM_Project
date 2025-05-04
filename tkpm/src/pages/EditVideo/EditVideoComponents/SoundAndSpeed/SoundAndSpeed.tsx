import React from 'react';
import styles from '../../EditVideo.module.css';

type SoundAndSpeedProps = {
    volume: number;
    handleVolumeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    speed: number;
    handleSpeedChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    musicFile: File | null;
    handleMusicFileChange: (file: File) => void;
    handleMusicFileRemove: () => void;
};

const SoundAndSpeed: React.FC<SoundAndSpeedProps> = ({
    volume,
    handleVolumeChange,
    speed,
    handleSpeedChange,
    musicFile,
    handleMusicFileChange,
    handleMusicFileRemove,
}) => (
    <div className={styles.soundAndSpeed}>
        {/* Volume */}
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

        {/* Music Upload */}
        <div className={styles.soundControl}>
            <img src="/music.png" alt="Music Icon" className={styles.soundIcon} style={{marginLeft: '0px', marginRight: '1 rem'}}/>

            <div className={styles.musicInputWrapper}>
                <label className={styles.musicInputLabel}>
                    Chọn nhạc
                    <input
                        type="file"
                        accept="audio/*"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                handleMusicFileChange(file);
                            }
                        }}
                        className={styles.musicInput}
                    />
                </label>

                {musicFile && (
                    <div className={styles.musicFileInfo} >
                        <span className={styles.musicFileName} style={{maxWidth: '20rem'}}>{musicFile.name}</span>
                        <button
                            onClick={handleMusicFileRemove}
                            className={styles.removeButton}
                            type="button"
                        >
                            Xóa
                        </button>
                    </div>
                )}
            </div>
        </div>

        {/* Speed */}
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