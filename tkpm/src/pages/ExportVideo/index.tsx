import React, { useState, useRef, useEffect } from "react";
import styles from "./ExportVideo.module.css";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";

const resolutionOptions = ["360p", "720p", "1080p", "4k"];
const videoUrl = "/videodemo.mp4";

function ExportVideo() {
    const navigate = useNavigate();

    const [selectedResolution, setResolution] = useState<string>("720p");

    const handleResolutionClick = (style: string) => {
        if (style !== selectedResolution) {
            setResolution(style);
        }
    };    
    
    const handleUploadToYouTube = () => {
        window.location.href = "http://localhost:3000/api/upload/auth";
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
                    <div className={styles.titleBody}>Resolution</div>

                    <div className={`${styles.style_buttons} content`}>
                        {resolutionOptions.map((style) => (
                            <button
                                key={style}
                                onClick={() => handleResolutionClick(style)}
                                className={clsx(styles.style_button, {
                                    [styles.activeContent]: selectedResolution === style,
                                })}
                            >
                                {style}
                            </button>
                        ))}
                    </div>
                </div>

                <div className={styles.rightPanel}>
                    <div className={styles.titleBody}>Store - Share</div>
                        <div className={styles.optionsStoreShare}>
                            <img src="/iconSave.png" alt="Save" className={styles.iconStoreShare} />
                            <img 
                                src="/iconYoutube.png" 
                                alt="YouTube" 
                                className={styles.iconStoreShare}
                                onClick={handleUploadToYouTube}
                            />
                            <img src="/iconTiktok.png" alt="TikTok" className={styles.iconStoreShare} />
                            <img src="/iconFacebook.png" alt="Facebook" className={styles.iconStoreShare} />
                        </div>
                </div>
            </div>
        </div>
    );
}

export default ExportVideo;
