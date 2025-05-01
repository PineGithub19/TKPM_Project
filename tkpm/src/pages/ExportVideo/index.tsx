import React, { useState, useEffect } from "react";
import styles from "./ExportVideo.module.css";
import { useNavigate, useLocation } from "react-router-dom";
import clsx from "clsx";

const resolutionOptions = ["360p", "720p", "1080p", "4k"];
const videoUrl = "../../public/videodemo.mp4";

function ExportVideo() {
    const navigate = useNavigate();
    const location = useLocation();

    const [selectedResolution, setResolution] = useState<string>("720p");
    const [showModal, setShowModal] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);

    // Đọc query parameters để kiểm tra nếu video đã được đăng thành công
    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const success = searchParams.get("uploadSuccess");
        if (success === "true") {
            setUploadSuccess(true);
        }
    }, [location.search]);

    // Tự động đóng thông báo sau 3 giây
    useEffect(() => {
        if (uploadSuccess) {
            const timer = setTimeout(() => {
                setUploadSuccess(false);
            }, 3000); // 3000ms = 3s
            return () => clearTimeout(timer); // Dọn dẹp timer khi component bị hủy
        }
    }, [uploadSuccess]);

    const handleResolutionClick = (style: string) => {
        if (style !== selectedResolution) {
            setResolution(style);
        }
    };

    const handleUploadToYouTube = () => {
        setShowModal(true);
    };

    const handleSubmit = () => {
        const updatedDescription = description + " #ChillUS";
        
        const query = new URLSearchParams({
            title,
            description: updatedDescription
        }).toString();
    
        window.location.href = `http://localhost:3000/api/upload/auth?${query}`;
    };
    

    const handleCancel = () => {
        setShowModal(false);
        setTitle("");
        setDescription("");
    };

    const handleCloseSuccessMessage = () => {
        setUploadSuccess(false);
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <button onClick={() => navigate("/edit-video")} className={styles.backButton}>
                    <img src="/arrow_left_black.png" alt="Back" className={styles.arrowIcon} />
                </button>
                <span className={styles.title}>Export Video</span>
            </div>

            <div className={styles.body}>
                <div className={styles.introImageWrapper}>
                    <video controls className={`${styles.previewImage}`} src={videoUrl}>
                        <source src={videoUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
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

            {showModal && (
                <div className={styles.modal} style={{ animation: "fadeIn 0.3s ease-out" }}>
                    <h3>Thông tin video YouTube</h3>
                    <input
                        type="text"
                        placeholder="Nhập tiêu đề video"
                        className={styles.modalInput}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                    <textarea
                        placeholder="Nhập mô tả video"
                        className={styles.modalInput}
                        style={{ marginTop: "10px" }}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                    <div style={{ marginTop: "10px", display: "flex", gap: "30px" }}>
                        <button className={styles.submitButton} onClick={handleSubmit}>
                            Đăng lên YouTube
                        </button>
                        <button className={styles.cancelButton} onClick={handleCancel}>
                            Hủy
                        </button>
                    </div>
                </div>
            )}

            {/* Hiển thị thông báo khi video upload thành công */}
            {uploadSuccess && (
                <div className={styles.successMessage}>
                    <span>Video đã được đăng thành công!</span>
                    <button className={styles.closeButton} onClick={handleCloseSuccessMessage}>
                        &times;
                    </button>
                </div>
            )}
        </div>
    );
}

export default ExportVideo;
