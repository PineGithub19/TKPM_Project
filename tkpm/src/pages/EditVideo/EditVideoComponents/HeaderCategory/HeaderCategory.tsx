import React from 'react';
import styles from '../../EditVideo.module.css';

type HeaderCategoryProps = {
    selectedIcon: string;
};

const HeaderCategory: React.FC<HeaderCategoryProps> = ({ selectedIcon }) => {
    return (
        <div className={styles.right}>
            {selectedIcon === 'iconRatio' ? (
                <span className={styles.editCategory}>Ratio</span>
            ) : selectedIcon === 'iconSound' ? (
                <span className={styles.editCategory}>Sound And Speed</span>
            ) : selectedIcon === 'iconAdjust' ? (
                <span className={styles.editCategory}>Image Adjustment</span>
            ) : selectedIcon === 'iconCutImage' ? (
                <span className={styles.editCategory}>Image Edit</span>
            ) : selectedIcon === 'iconLayout' ? (
                <span className={styles.editCategory}>Image Layout</span>
            ) : selectedIcon === 'iconCaption' ? (
                <span className={styles.editCategory}>Caption Edit</span>
            ) : selectedIcon === 'iconPrompt' ? (
                <span className={styles.editCategory}>New Prompt</span>
            ) : (
                <span className={styles.editCategory}>Images</span>
            )}
        </div>
    );
};

export default HeaderCategory;
