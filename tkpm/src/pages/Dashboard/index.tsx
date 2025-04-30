import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilm } from '@fortawesome/free-solid-svg-icons';
import { faImage } from '@fortawesome/free-solid-svg-icons';
import styles from './DashBoard.module.css';
import LoadingComponent from '../../components/Loading';
import FloatingParticles from '../CreateVideo/CreateVideoComponents/FloatingParticles/FloatingParticles';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import dayjs from 'dayjs'; // Cài đặt dayjs để làm việc với ngày tháng

// Register chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function DashBoard() {
    const navigate = useNavigate();
    const location = useLocation();
    const [isLoading, setIsLoading] = useState(false);
    const [videoInformation, setVideoInformation] = useState<any[]>([]);

    const handleCreateVideo = async () => {
        try {
            setIsLoading(true);
            navigate('/create-video');
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteVideo = (videoId: string) => {
        setVideoInformation((prevVideos) => prevVideos.filter((video) => video.videoId !== videoId));
    };

    useEffect(() => {
        if (location.state && location.state.videoInformation) {
            console.log("Received video information:", location.state.videoInformation);
            setVideoInformation(location.state.videoInformation);  // Nhận dữ liệu video từ state
        }
    }, [location.state]);

    // Gộp dữ liệu theo ngày
    const aggregatedData: Record<string, { views: number, likes: number, comments: number }> = {};

    videoInformation.forEach((video) => {
        const date = dayjs(video.publishedAt).format('YYYY-MM-DD');
        if (!aggregatedData[date]) {
            aggregatedData[date] = { views: 0, likes: 0, comments: 0 };
        }
        
        // Chuyển các giá trị chuỗi sang kiểu số nguyên
        aggregatedData[date].views += Number(video.views); // Dùng Number() để chuyển thành số
        aggregatedData[date].likes += Number(video.likes); // Dùng Number() để chuyển thành số
        aggregatedData[date].comments += Number(video.comments); // Dùng Number() để chuyển thành số

        // Log ra từng video để kiểm tra dữ liệu
        console.log(`Video ID: ${video.videoId}, Published At: ${video.publishedAt}`);
        console.log(`Aggregated Data for ${date}:`, aggregatedData[date]);
    });

    // Chuyển sang dạng biểu đồ
    const sortedDates = Object.keys(aggregatedData).sort(); // Sắp xếp ngày theo thứ tự tăng dần

    console.log("Sorted Dates:", sortedDates);  // Log các ngày sau khi sắp xếp
    console.log("Aggregated Data:", aggregatedData);  // Log toàn bộ dữ liệu đã được gộp

    const chartData = {
        labels: sortedDates, // Các ngày làm trục X
        datasets: [
            {
                label: 'Views',
                data: sortedDates.map(date => aggregatedData[date].views), // Tổng views theo từng ngày
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                fill: true,
            },
            {
                label: 'Likes',
                data: sortedDates.map(date => aggregatedData[date].likes), // Tổng likes theo từng ngày
                borderColor: 'rgba(255, 159, 64, 1)',
                backgroundColor: 'rgba(255, 159, 64, 0.2)',
                fill: true,
            },
            {
                label: 'Comments',
                data: sortedDates.map(date => aggregatedData[date].comments), // Tổng comments theo từng ngày
                borderColor: 'rgba(153, 102, 255, 1)',
                backgroundColor: 'rgba(153, 102, 255, 0.2)',
                fill: true,
            },
        ],
    };

    return (
        <div className={clsx(styles.dashboard)}>
            <FloatingParticles />
            {isLoading && (
                <LoadingComponent
                    customClassName={clsx('position-absolute', 'top-50', 'start-50')}
                    isOverlay={isLoading}
                />
            )}
            <div className={clsx(styles.dashboardContainer)}>
                <h2 className={clsx('text-light', 'mt-4', 'mb-4')}>Create your video in minutes</h2>
                <div className={clsx('d-flex')} style={{ margin: '50px 0 0 0' }}>
                    <div
                        className={clsx(styles.videoContainer, 'd-flex', 'flex-column', 'justify-content-center')}
                        onClick={handleCreateVideo}
                    >
                        <FontAwesomeIcon icon={faFilm} className={clsx(styles.icon, 'mb-3')} />
                        <h5>Create new video</h5>
                    </div>
                </div>
            </div>

            <div className={clsx(styles.dashboardContainer)}>
                <div className={clsx('d-flex')}>
                    <div
                        className={clsx(styles.imageGenerateContainer, 'd-flex', 'flex-column', 'justify-content-center')}
                    >
                        <FontAwesomeIcon icon={faImage} className={clsx(styles.icon, 'mb-3')} />
                        <h5>Create new image</h5>
                    </div>
                </div>
            </div>

            {/* Biểu đồ */}
            <div className={clsx(styles.chart)}>
                <h3 className={clsx('text-light', 'mt-4', 'mb-4')}>Video Statistics</h3>
                <div className={clsx(styles.chartContainer)}>
                    <Line
                        data={chartData}
                        options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: {
                                x: {
                                    ticks: {
                                        font: {
                                            size: 24,
                                        },
                                    },
                                    title: {
                                        display: true,
                                        text: 'Time',
                                        font: {
                                            size: 24,
                                        },
                                    },
                                },
                                y: {
                                    beginAtZero: true,
                                    ticks: {
                                        stepSize: 1,
                                        font: {
                                            size: 24,
                                        },
                                        callback: function (value) {
                                            return Number.isInteger(value) ? value : null;
                                        }
                                    },
                                    title: {
                                        display: true,
                                        text: 'Total Count',
                                        font: {
                                            size: 24,
                                        },
                                    },
                                },
                            },
                            plugins: {
                                legend: {
                                    labels: {
                                        font: {
                                            size: 24,
                                        },
                                    },
                                },
                            },
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

export default DashBoard;
