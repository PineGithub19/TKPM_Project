import axios, { AxiosInstance } from 'axios';

const request: AxiosInstance = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL as string,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, 
});

export const get = async (url: string, params?: Record<string, unknown>) => {
    const response = await request.get(url, { params });
    return response.data;
};

export const post = async (url: string, data?: Record<string, unknown>) => {
    const response = await request.post(url, data);
    return response.data;
};

export const put = async (url: string, data: Record<string, unknown>) => {
    const response = await request.put(url, data);
    return response.data;
};

export const del = async (url: string, params?: Record<string, unknown>) => {
    const response = await request.delete(url, { params });
    return response.data;
};
