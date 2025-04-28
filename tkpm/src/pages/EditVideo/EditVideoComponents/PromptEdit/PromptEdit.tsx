import React from 'react';
import styles from '../../EditVideo.module.css';
import clsx from 'clsx';

const contentStyleOptions = [
    'Analytical',
    'Narrative',
    'Modern',
    'Poetic Illustration',
    'Classic',
    'Storytelling',
    'Dramatic',
    'Satirical',
];

type PromptEditProps = {
    newPrompt: string;
    setnewPrompt: (value: string) => void;
    selectedContentStyles: string[];
    handleContentStyleClick: (style: string) => void;
};

const PromptEdit: React.FC<PromptEditProps> = ({
    newPrompt,
    setnewPrompt,
    selectedContentStyles,
    handleContentStyleClick,
}) => (
    <div className={styles.soundAndSpeed}>
        <div className={styles.captionEdit}>
            <div className={styles.captionText}>
                <textarea
                    className={clsx(styles.input_text)}
                    placeholder="Enter new prompt"
                    value={newPrompt}
                    onChange={(e) => setnewPrompt(e.target.value)}
                ></textarea>
            </div>
            <div className={styles.contentStyle}>
                <span className={styles.titleCaption}>Content Style</span>
                <div className={styles.formatContentStyle}>
                    <div className={`${styles.style_buttons} content`}>
                        {contentStyleOptions.map((style) => (
                            <button
                                key={style}
                                onClick={() => handleContentStyleClick(style)}
                                className={clsx(styles.style_button, {
                                    [styles.activeContent]: selectedContentStyles.includes(style),
                                })}
                            >
                                {style}
                            </button>
                        ))}
                    </div>
                    <div className={styles.style_recreate}>
                        <button className={styles.style_button_recreate}>Recreate</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

export default PromptEdit;
