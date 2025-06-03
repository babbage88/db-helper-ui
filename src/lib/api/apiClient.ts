// src/lib/http/client.ts
import axios, { type InternalAxiosRequestConfig } from 'axios';
import { TokenService } from '@/lib/tokenManager';

const API_BASE_URL = import.meta.env.VITE_AUTH_API_BASE_URL;

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: false,
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
    const token = TokenService.getAccessToken();
    if (token && config.headers) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
});

apiClient.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                .then((token) => {
                    if (typeof token !== 'string') {
                        return Promise.reject(new Error('Invalid token in retry queue'));
                    }
                    originalRequest.headers['Authorization'] = 'Bearer ' + token;
                    return apiClient(originalRequest);
                })
                .catch(err => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = TokenService.getRefreshToken();
            if (!refreshToken) {
                TokenService.clearTokens();
                TokenService.clearUserInfo();
                return Promise.reject(error);
            }

            try {
                const response = await axios.post(`${API_BASE_URL}/token/refresh`, {
                    refreshToken: refreshToken,
                });

                const newAccessToken = response.data.accessToken;
                const newRefreshToken = response.data.refreshToken;
                const userId = response.data.userId;
                const username = response.data.username;
                const email = response.data.email;

                TokenService.setAccessToken(newAccessToken);
                TokenService.setRefreshToken(newRefreshToken);
                TokenService.setUserInfo(userId, username, email);

                apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
                processQueue(null, newAccessToken);

                originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                return apiClient(originalRequest);
            } catch (err) {
                processQueue(err, null);
                TokenService.clearTokens();
                TokenService.clearUserInfo();

                return Promise.reject(err);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);


export default apiClient;
