// src/api/customHttpRequest.ts
import type { ApiRequestOptions } from './core/ApiRequestOptions';
import type { ApiResult } from './core/ApiResult';
import { axiosInstance } from './axiosInstance'; 

export type ApiResultWithBody<T> = Omit<ApiResult, 'body'> & { body: T };


export async function customHttpRequest<T>(options: ApiRequestOptions): Promise<ApiResultWithBody<T>> {
  const { method, url, headers = {}, body } = options;

  const response = await axiosInstance.request({
    method,
    url,
    headers,
    data: body,
  });

  return {
    url,
    status: response.status,
    statusText: response.statusText,
    ok: response.status >= 200 && response.status < 300,
    body: response.data as T,
  };
}


