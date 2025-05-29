import axios from 'axios';
import { TokenService } from '@/lib/tokenManager';
import { AuthenticationService } from './services/AuthenticationService';
import type { TokenRefreshReq } from './models/TokenRefreshReq';

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_AUTH_API_BASE_URL || 'http://localhost:8993', // adjust as needed
});


let isRefreshing = false;
let refreshQueue: (() => void)[] = [];

axiosInstance.interceptors.request.use(config => {
    const token = TokenService.getAccessToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

axiosInstance.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise(resolve => {
                    refreshQueue.push(() => resolve(axiosInstance(originalRequest)));
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshToken = TokenService.getRefreshToken();
                if (!refreshToken) throw new Error('No refresh token available');

                const res = await AuthenticationService.refreshAccessToken({
                    refresh_token: refreshToken,
                } as TokenRefreshReq);

                TokenService.setAccessToken(res.accessToken!);
                TokenService.setRefreshToken(res.refreshToken!);

                // Retry original request with new token
                axiosInstance.defaults.headers.common.Authorization = `Bearer ${res.accessToken}`;

                refreshQueue.forEach(cb => cb());
                refreshQueue = [];

                return axiosInstance(originalRequest);
            } catch (e) {
                TokenService.clearTokens();
                window.location.href = '/login'; // Optional: redirect to login
                return Promise.reject(e);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);


