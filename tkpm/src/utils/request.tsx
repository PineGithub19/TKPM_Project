import axios, { AxiosInstance } from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const request: AxiosInstance = axios.create({
    baseURL: process.env.BACKEND_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const get = async (url: string, params?: Record<string, unknown>) => {
    const response = await request.get(url, { params });
    return response.data;
};

export const post = async (url: string, data: Record<string, unknown>) => {
    const response = await request.post(url, data);
    return response.data;
};

export const put = async (url: string, data: Record<string, unknown>) => {
    const response = await request.put(url, data);
    return response.data;
};

export const del = async (url: string) => {
    const response = await request.delete(url);
    return response.data;
};

export default request;
