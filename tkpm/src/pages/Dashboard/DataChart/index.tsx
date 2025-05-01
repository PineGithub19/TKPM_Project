import { useEffect, useState } from 'react';
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
import { Line } from 'react-chartjs-2';
import * as request from '../../../utils/request';
import { format } from 'date-fns';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface VideoInformation {
    is_finished: boolean;
    publish_date: string;
}

interface ChartData {
    date: string;
    completed: number;
    inProgress: number;
}

function DataChart() {
    const [chartData, setChartData] = useState<ChartData[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await request.get('/video/all');

                if (response && response.videos) {
                    const videos: VideoInformation[] = response.videos;

                    const grouped: Record<string, ChartData> = {};

                    videos.forEach((video) => {
                        if (!video.publish_date) return;

                        // Format ISO date to dd/MM/yyyy
                        const date = format(new Date(video.publish_date), 'dd/MM/yyyy');

                        if (!grouped[date]) {
                            grouped[date] = { date, completed: 0, inProgress: 0 };
                        }

                        if (video.is_finished) {
                            grouped[date].completed += 1;
                        } else {
                            grouped[date].inProgress += 1;
                        }
                    });

                    const sortedData = Object.values(grouped).sort(
                        (a, b) =>
                            new Date(b.date.split('/').reverse().join('-')).getTime() -
                            new Date(a.date.split('/').reverse().join('-')).getTime(),
                    );

                    setChartData(sortedData);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, []);

    const data = {
        labels: chartData.map((entry) => entry.date),
        datasets: [
            {
                label: 'Completed',
                data: chartData.map((entry) => entry.completed),
                borderColor: '#8884d8',
                backgroundColor: 'rgba(136, 132, 216, 0.2)',
                fill: false,
            },
            {
                label: 'In Progress',
                data: chartData.map((entry) => entry.inProgress),
                borderColor: '#82ca9d',
                backgroundColor: 'rgba(130, 202, 157, 0.2)',
                fill: false,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
                labels: {
                    font: {
                        size: 18,
                    },
                },
            },
        },
        scales: {
            x: {
                ticks: {
                    font: {
                        size: 18,
                    },
                },
                title: {
                    display: true,
                    text: 'Date',
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
                    callback: function (value: string | number) {
                        return Number.isInteger(value) ? value : null;
                    },
                },
                title: {
                    display: true,
                    text: 'Count',
                    font: {
                        size: 18,
                    },
                },
            },
        },
    };

    return <Line data={data} options={options} />;
}

export default DataChart;
