import { useState, useEffect } from "react";
import styles from "./ExportVideo.module.css";
import { useNavigate, useLocation } from "react-router-dom";
import clsx from "clsx";

interface LocationState {
    videoUrl?: string;
}

const resolutionOptions = ["360p", "720p", "1080p", "4k"];

function ExportVideo() {
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state as LocationState;
    
    const [selectedResolution, setResolution] = useState<string[]>(["1080p"]);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [isVideoLoading, setIsVideoLoading] = useState<boolean>(true);
    
    // Cập nhật videoUrl khi location state thay đổi
    useEffect(() => {
        if (state?.videoUrl) {
            // Thêm timestamp để tránh cache
            setVideoUrl(`http://localhost:3000/videos/final_output_with_music.mp4`);
        }
    }, [state]);
    
    const handleVideoLoaded = () => {
        setIsVideoLoading(false);
    };

    const handleResolutionClick = (style: string) => {
        setResolution([style]); // Chỉ cho chọn một resolution
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
                    {videoUrl ? (
                        <>
                            {isVideoLoading && (
                                <div className={styles.loadingOverlay}>
                                    <span className={styles.loader}></span>
                                </div>
                            )}
                            <video 
                                src={videoUrl}
                                controls
                                className={styles.previewVideo}
                                onLoadedData={handleVideoLoaded}
                                autoPlay
                            />
                        </>
                    ) : (
                        <div className={styles.noVideoMessage}>
                            <p>Video đang được xử lý...</p>
                            <span className={styles.loader}></span>
                        </div>
                    )}
                </div>
            </div>

            <div className={styles.footer}>
                <div className={styles.leftPanel}>
                    <div className={styles.resolutionSection}>
                        <h3>Chất lượng</h3>
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
                </div>

                <div className={styles.rightPanel}>
                    <div className={styles.exportButtons}>
                        <button className={styles.downloadButton}>
                            Tải xuống
                        </button>
                        <button className={styles.shareButton}>
                            Chia sẻ
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ExportVideo;
