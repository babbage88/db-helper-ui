import apiClient from "@/lib/api/apiClient";

export type HostResourceStats = {
  hostServerId: string;
  hostname: string;
  ipAddress: string;
  capacityRole: "physical" | "hypervisor" | "guest" | "unclassified";
  hostServerTypes?: string[];
  platformTypes?: string[];
  collectedAt: string;
  status: "ok" | "error";
  error?: string;
  cpuCores?: number;
  memoryTotalBytes?: number;
  memoryAvailableBytes?: number;
  storageTotalBytes?: number;
  storageAvailableBytes?: number;
};

export type HostResourceStatsSummary = {
  collectedAt: string;
  hostCount: number;
  reachableHostCount: number;
  capacityHostCount: number;
  guestHostCount: number;
  unclassifiedHostCount: number;
  totalCpuCores: number;
  memoryTotalBytes: number;
  memoryAvailableBytes: number;
  storageTotalBytes: number;
  storageAvailableBytes: number;
  guestTotalCpuCores: number;
  guestMemoryTotalBytes: number;
  guestMemoryAvailableBytes: number;
  guestStorageTotalBytes: number;
  guestStorageAvailableBytes: number;
  unclassifiedTotalCpuCores: number;
  unclassifiedMemoryTotalBytes: number;
  unclassifiedStorageTotalBytes: number;
  unclassifiedStorageAvailableBytes: number;
  hasCpuCores: boolean;
  hasMemory: boolean;
  hasStorage: boolean;
  hasGuestCpuCores: boolean;
  hasGuestMemory: boolean;
  hasGuestStorage: boolean;
  hasUnclassifiedStats: boolean;
  hosts: HostResourceStats[];
};

export const hostStatsApi = {
  async getSummary() {
    const response = await apiClient.get<HostResourceStatsSummary>(
      "/host-servers/stats"
    );
    return response.data;
  },

  async getHostStats(hostServerId: string) {
    const response = await apiClient.get<HostResourceStats>(
      `/host-servers/${encodeURIComponent(hostServerId)}/stats`
    );
    return response.data;
  },
};
