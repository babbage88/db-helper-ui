import apiClient from "@/lib/api/apiClient";
import { TokenService } from "@/lib/tokenManager";

export type S3EndpointSummary = {
  name: string;
  displayName: string;
  endpoint: string;
  provider: string;
  isDefault: boolean;
  useSsl: boolean;
  manageable: boolean;
  defaultBucket?: string;
  bucketCount: number;
  matchedHostServerId?: string;
  matchedHostServerName?: string;
  availableStorageBytes?: number;
};

export type S3BucketSummary = {
  name: string;
  createdAt: string;
  objectCount: number;
  totalSize: number;
  isDefault: boolean;
  endpointName: string;
};

export type S3ObjectSummary = {
  key: string;
  size: number;
  eTag: string;
  lastModified: string;
  contentType?: string;
};

export const s3AdminApi = {
  async listEndpoints() {
    const response = await apiClient.get<S3EndpointSummary[]>("/storage/s3/endpoints");
    return response.data;
  },

  async listBuckets(endpointName: string) {
    const response = await apiClient.get<S3BucketSummary[]>(`/storage/s3/endpoints/${encodeURIComponent(endpointName)}/buckets`);
    return response.data;
  },

  async createBucket(endpointName: string, name: string) {
    await apiClient.post(`/storage/s3/endpoints/${encodeURIComponent(endpointName)}/buckets`, { name });
  },

  async deleteBucket(endpointName: string, bucketName: string) {
    await apiClient.delete(`/storage/s3/endpoints/${encodeURIComponent(endpointName)}/buckets/${encodeURIComponent(bucketName)}`);
  },

  async listObjects(endpointName: string, bucketName: string, prefix?: string) {
    const response = await apiClient.get<S3ObjectSummary[]>(
      `/storage/s3/endpoints/${encodeURIComponent(endpointName)}/buckets/${encodeURIComponent(bucketName)}/objects`,
      { params: prefix ? { prefix } : undefined },
    );
    return response.data;
  },

  async uploadObject(endpointName: string, bucketName: string, file: File, objectKey?: string) {
    const formData = new FormData();
    formData.append("file", file);
    if (objectKey) {
      formData.append("objectKey", objectKey);
    }

    await apiClient.post(
      `/storage/s3/endpoints/${encodeURIComponent(endpointName)}/buckets/${encodeURIComponent(bucketName)}/objects`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
  },

  async deleteObject(endpointName: string, bucketName: string, key: string) {
    await apiClient.delete(
      `/storage/s3/endpoints/${encodeURIComponent(endpointName)}/buckets/${encodeURIComponent(bucketName)}/objects`,
      { params: { key } },
    );
  },

  async downloadObject(endpointName: string, bucketName: string, key: string) {
    const baseUrl = import.meta.env.VITE_API_WEB_INFRA_URL;
    const token = TokenService.getAccessToken();
    const url = new URL(
      `/storage/s3/endpoints/${encodeURIComponent(endpointName)}/buckets/${encodeURIComponent(bucketName)}/download`,
      baseUrl,
    );
    url.searchParams.set("key", key);

    const response = await fetch(url.toString(), {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || "Failed to download object");
    }

    const blob = await response.blob();
    const objectUrl = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = key.split("/").pop() || "download";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(objectUrl);
  },
};

export function formatBytes(value?: number | null) {
  if (value === null || value === undefined) {
    return "Unavailable";
  }

  if (value === 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  let size = value;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}
