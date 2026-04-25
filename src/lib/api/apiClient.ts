// src/lib/http/client.ts
import axios, { type InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_WEB_INFRA_URL;

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    // Only set baseURL if not already set (allows per-request override)
    if (!config.baseURL) {
        config.baseURL = API_BASE_URL;
    }
    return config;
});

apiClient.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest?._retry && !String(originalRequest?.url || '').includes('/token/refresh')) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                .then(() => {
                    return apiClient(originalRequest);
                })
                .catch(err => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                await axios.post(`${API_BASE_URL}/token/refresh`, {}, {
                    withCredentials: true,
                });
                processQueue(null);
                return apiClient(originalRequest);
            } catch (err) {
                processQueue(err, null);
                return Promise.reject(err);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);


export default apiClient;
