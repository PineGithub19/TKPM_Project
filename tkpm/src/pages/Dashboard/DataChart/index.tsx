import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import * as request from '../../../utils/request';
import { format } from 'date-fns';

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
                            grouped[date] = {
                                date,
                                completed: 0,
                                inProgress: 0,
                            };
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

    useEffect(() => {
        console.log('Chart Data:', chartData); // Log the chart data for debugging
    }, [chartData]);

    return (
        <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="completed" stroke="#8884d8" name="Completed" />
                <Line type="monotone" dataKey="inProgress" stroke="#82ca9d" name="In Progress" />
            </LineChart>
        </ResponsiveContainer>
    );
}

export default DataChart;
