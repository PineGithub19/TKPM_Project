import React from 'react';
import styles from '../../EditVideo.module.css';

type ImageEditProps = {
    iconFlipColor: string;
    handleFlipVerticalClick: () => void;
    iconRotateColor: string;
    handleRotateClick: () => void;
};

const ImageEdit: React.FC<ImageEditProps> = ({
    iconFlipColor,
    handleFlipVerticalClick,
    iconRotateColor,
    handleRotateClick,
}) => (
    <div className={styles.imageEdit}>
        <img
            src={iconFlipColor}
            alt="Flip Vertical Icon"
            className={styles.soundIcon}
            onClick={handleFlipVerticalClick}
        />
        <img src={iconRotateColor} alt="Rotate Icon" className={styles.soundIcon} onClick={handleRotateClick} />
    </div>
);

export default ImageEdit;
