import React from 'react';
import styles from '../../EditVideo.module.css';
import clsx from 'clsx';

type CaptionEditProps = {
    caption: string;
    setCaption: (value: string) => void;
};

const CaptionEdit: React.FC<CaptionEditProps> = ({ caption, setCaption }) => (
    <div className={styles.captionEdit}>
        <div className={styles.captionText}>
            <textarea
                className={clsx(styles.input_text)}
                placeholder="Enter caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
            ></textarea>
            <img src="/iconCheck.png" alt="Check Icon" className={styles.iconCheck} />
        </div>
        <div className={styles.captionStyle}>
            <span className={styles.titleCaption}>Caption Style</span>
            <div className={styles.formatStyle}>
                <img src="/iconBold.png" alt="Bold Icon" className={styles.iconFormat} />
                <img src="/iconItalic.png" alt="Italic Icon" className={styles.iconFormat} />
                <img src="/iconUnderline.png" alt="Underline Icon" className={styles.iconFormat} />
            </div>
        </div>
        <div className={styles.captionStyle}>
            <div className={styles.titleAutomatic}>
                <span className={styles.titleCaption}>Automatic subtitles</span>
                <img src="/iconStar.png" alt="Automatic Subtitles Icon" className={styles.iconAutomaticSubtitles} />
            </div>
            <div className={styles.formatStyle}>
                <img src="/iconAutomaticSubtitles.png" alt="Automatic Subtitles Icon" className={styles.iconFormat} />
            </div>
        </div>
    </div>
);

export default CaptionEdit;
