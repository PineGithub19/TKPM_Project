import React, { useState, useRef, useEffect } from "react";
import styles from "./ExportVideo.module.css";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";

const resolutionOptions = ["360p", "720p", "1080p", "4k"];

function ExportVideo() {
    const navigate = useNavigate();

    const [selectedResolution, setResolution] = useState<string[]>([]);

    const handleResolutionClick = (style: string) => {
        setResolution((prev) =>
            prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]
        );
    };
    
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <button onClick={() => navigate('/edit-video')} className={styles.backButton}>
                    <img src="/arrow_left_black.png" alt="Back" className={styles.arrowIcon} />
                </button>
                <span className={styles.title}>Export Video</span>
            </div>

            <div className={styles.body}>
                <div className={styles.introImageWrapper}>
                    <img
                        src={"/anime.png"}
                        alt="Final video"
                        className={`${styles.previewImage}`}
                    />
                    <button className={styles.pauseButton}>
                        <img src="/pause.png" alt="Pause" className={styles.pauseIcon} />
                    </button>
                    <button className={styles.zoomButton}>
                        <img src="/icon_zoom.png" alt="Zoom" className={styles.zoomIcon} />
                    </button>
                </div>
            </div>

            <div className={styles.footer}>
                <div className={styles.leftPanel}>
                    <div className={`${styles.style_buttons} content`}>
                        {resolutionOptions.map((style) => (
                            <button
                                key={style}
                                onClick={() => handleResolutionClick(style)}
                                className={clsx(styles.style_button, {
                                    [styles.activeContent]: selectedResolution.includes(style),
                                })}>
                                {style}
                            </button>
                        ))}
                    </div>
                </div>

                <div className={styles.rightPanel}>
a
                </div>
            </div>
        </div>
    );
}

export default ExportVideo;
