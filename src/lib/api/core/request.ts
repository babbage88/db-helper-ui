// src/lib/api/core/request.ts
import type { ApiRequestOptions } from './ApiRequestOptions';
import { axiosInstance } from '../axiosInstance'; // your axios with interceptors

export async function request(options: ApiRequestOptions): Promise<any> {
  const { method, url, headers = {}, body, mediaType } = options;

  const response = await axiosInstance.request({
    method,
    url,
    headers,
    data: body,
    responseType: mediaType === 'application/octet-stream' ? 'blob' : 'json',
  });

  return response.data;
}