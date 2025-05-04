import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilm } from '@fortawesome/free-solid-svg-icons';
import styles from './DashBoard.module.css';
import LoadingComponent from '../../components/Loading';
import FloatingParticles from '../CreateVideo/CreateVideoComponents/FloatingParticles/FloatingParticles';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import dayjs from 'dayjs'; // Cài đặt dayjs để làm việc với ngày tháng
import DefaultVideoItem from './DefaultVideoItem';
import * as request from '../../utils/request';
import DataChart from './DataChart';
import axios from 'axios';

// Register chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface VideoInformation {
    videoId: string;
    scriptId: string;
    voiceId: string;
    imageId: string;
    is_finished: boolean;
    background: string;
}

interface VideoConfigData {
    _id?: string;
    user_id?: string;
    literature_work_id: string;
    script: string;
    voice_config: string;
    image_config: string;
    is_finished: boolean;
    publish_date: Date;
}

function DashBoard() {
    const navigate = useNavigate();
    const location = useLocation();
    const [isLoading, setIsLoading] = useState(false);
    const [videoInformation, setVideoInformation] = useState<any[]>([]);
    const [videoInWeb, setVideoInWeb] = useState<VideoInformation[]>([]);

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
        setVideoInWeb((prevVideos) => prevVideos.filter((video) => video.videoId !== videoId));
    };

    useEffect(() => {
        const token = localStorage.getItem('googleToken');
        const tokenExpiration = localStorage.getItem('tokenExpiration'); // Lấy thời gian hết hạn token

        if (!token || !tokenExpiration) {
            navigate('/login');
        } else {
            const currentTime = new Date().getTime();

            if (currentTime > parseInt(tokenExpiration)) {
                localStorage.removeItem('googleToken');
                localStorage.removeItem('tokenExpiration');
                navigate('/login');
            } else {
                const fetchVideoStats = async () => {
                    try {
                        setIsLoading(true);

                        console.log('Fetching video stats...');
                        const youtubeResponse = await axios.get('https://www.googleapis.com/youtube/v3/search', {
                            params: {
                                part: 'snippet',
                                forMine: true,
                                type: 'video',
                                maxResults: 10,
                            },
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        });
                        console.log('Youtube response:', youtubeResponse.data);
                        const videoItems = youtubeResponse.data.items;

                        // Lọc video có #ChillUS trong description
                        const filteredVideoItems = videoItems.filter((video: any) =>
                            video.snippet.description.includes('#ChillUS'),
                        );

                        if (filteredVideoItems.length > 0) {
                            const videoIds = filteredVideoItems.map((v: any) => v.id.videoId).join(',');

                            const statsResponse = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
                                params: {
                                    part: 'snippet,statistics',
                                    id: videoIds,
                                },
                                headers: {
                                    Authorization: `Bearer ${token}`,
                                },
                            });

                            const videoStats = statsResponse.data.items.map((video: any) => ({
                                videoId: video.id,
                                views: video.statistics.viewCount,
                                likes: video.statistics.likeCount,
                                comments: video.statistics.commentCount,
                                publishedAt: video.snippet.publishedAt,
                            }));

                            setVideoInformation(videoStats);
                        } else {
                            console.log('No videos found with #ChillUS in description.');
                        }
                    } catch (err) {
                        console.error(err);
                    } finally {
                        setIsLoading(false);
                    }
                };

                fetchVideoStats();
            }
        }
    }, [navigate]);

    // Gộp dữ liệu theo ngày
    const aggregatedData: Record<string, { views: number; likes: number; comments: number }> = {};

    videoInformation.forEach((video) => {
        const date = dayjs(video.publishedAt).format('YYYY-MM-DD');
        if (!aggregatedData[date]) {
            aggregatedData[date] = { views: 0, likes: 0, comments: 0 };
        }

        // Chuyển các giá trị chuỗi sang kiểu số nguyên
        aggregatedData[date].views += Number(video.views); // Dùng Number() để chuyển thành số
        aggregatedData[date].likes += Number(video.likes); // Dùng Number() để chuyển thành số
        aggregatedData[date].comments += Number(video.comments); // Dùng Number() để chuyển thành số
    });

    // Chuyển sang dạng biểu đồ
    const sortedDates = Object.keys(aggregatedData).sort(); // Sắp xếp ngày theo thứ tự tăng dần

    const chartData = {
        labels: sortedDates, // Các ngày làm trục X
        datasets: [
            {
                label: 'Views',
                data: sortedDates.map((date) => aggregatedData[date].views), // Tổng views theo từng ngày
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                fill: true,
            },
            {
                label: 'Likes',
                data: sortedDates.map((date) => aggregatedData[date].likes), // Tổng likes theo từng ngày
                borderColor: 'rgba(255, 159, 64, 1)',
                backgroundColor: 'rgba(255, 159, 64, 0.2)',
                fill: true,
            },
            {
                label: 'Comments',
                data: sortedDates.map((date) => aggregatedData[date].comments), // Tổng comments theo từng ngày
                borderColor: 'rgba(153, 102, 255, 1)',
                backgroundColor: 'rgba(153, 102, 255, 0.2)',
                fill: true,
            },
        ],
    };

    useEffect(() => {
        const fetchVideoInformation = async () => {
            try {
                setIsLoading(true);
                const response = await request.get('/video/all');

                if (response) {
                    setVideoInWeb(
                        response.videos.map((item: VideoConfigData) => ({
                            videoId: item._id,
                            scriptId: item.literature_work_id,
                            voiceId: item.voice_config,
                            imageId: item.image_config,
                            is_finished: item.is_finished,
                        })) || [],
                    );
                }
            } catch (error) {
                console.error('Error fetching video information:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchVideoInformation();

        return () => {
            setVideoInWeb([]);
        };
    }, []);

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
                <div className={clsx('d-flex')} style={{ margin: '50px 0 0 0', overflowX: 'hidden' }}>
                    <div
                        className={clsx(styles.videoContainer, 'd-flex', 'flex-column', 'justify-content-center')}
                        onClick={handleCreateVideo}
                    >
                        <FontAwesomeIcon icon={faFilm} className={clsx(styles.icon, 'mb-3')} />
                        <h5>Create new video</h5>
                    </div>
                    <div style={{ overflowX: 'auto' }} className={clsx(styles.videoList)}>
                        {videoInWeb.length > 0 &&
                            videoInWeb.map((video) => (
                                <DefaultVideoItem key={video.videoId} videoData={video} onDelete={handleDeleteVideo} />
                            ))}
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
                                            size: 18,
                                        },
                                    },
                                    title: {
                                        display: true,
                                        text: 'Time',
                                        font: {
                                            size: 18,
                                        },
                                    },
                                },
                                y: {
                                    beginAtZero: true,
                                    ticks: {
                                        stepSize: 1,
                                        font: {
                                            size: 18,
                                        },
                                        callback: function (value) {
                                            return Number.isInteger(value) ? value : null;
                                        },
                                    },
                                    title: {
                                        display: true,
                                        text: 'Total Count',
                                        font: {
                                            size: 18,
                                        },
                                    },
                                },
                            },
                            plugins: {
                                legend: {
                                    labels: {
                                        font: {
                                            size: 18,
                                        },
                                    },
                                },
                            },
                        }}
                    />
                </div>
                <div className={clsx(styles.chartContainer)}>
                    <DataChart videosLength={videoInWeb.length} />
                </div>
            </div>
        </div>
    );
}

export default DashBoard;
