"use client";

import * as React from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Boxes,
  ChevronDown,
  ChevronRight,
  Cpu,
  HardDrive,
  Info,
  LoaderCircle,
  Network,
  PencilLine,
  Play,
  Power,
  RefreshCw,
  Server,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { ProxmoxContainer } from "@/lib/api/models/ProxmoxContainer";
import type { ProxmoxLXCResourcesResult } from "@/lib/api/models/ProxmoxLXCResourcesResult";
import type { ProxmoxLXCResourcesUpdateRequest } from "@/lib/api/models/ProxmoxLXCResourcesUpdateRequest";
import type { ProxmoxVM } from "@/lib/api/models/ProxmoxVM";
import type { ProxmoxVMHardwareResult } from "@/lib/api/models/ProxmoxVMHardwareResult";
import type { ProxmoxVMHardwareUpdateRequest } from "@/lib/api/models/ProxmoxVMHardwareUpdateRequest";
import type { ProxmoxWorkload } from "@/lib/api/models/ProxmoxWorkload";
import { HostServersService } from "@/lib/api/services/HostServersService";
import { ProxmoxService } from "@/lib/api/services/ProxmoxService";
import { hostStatsApi } from "@/lib/host-stats-api";
import {
  showErrorToast,
  showInfoToast,
  showSuccessToast,
  showWarningToast,
} from "@/lib/toast-utils";
import { cn } from "@/lib/utils";
import type { Node } from "./columns";

type InventoryErrors = {
  workloads?: string;
  vms?: string;
  containers?: string;
};

type HostSummary = {
  cpuCores?: number;
  memoryTotalBytes?: number;
  storageTotalBytes?: number;
  status?: string;
  error?: string;
};

type InventorySnapshot = {
  workloads: ProxmoxWorkload[];
  vms: ProxmoxVM[];
  containers: ProxmoxContainer[];
  errors: InventoryErrors;
  hostSummary?: HostSummary | null;
};

type WorkloadKind = "qemu" | "lxc";

type ExplorerItem = {
  id: string;
  kind: WorkloadKind;
  label: string;
  status?: string;
  vmid?: number;
  node?: string;
  cpu?: number;
  mem?: number;
  maxmem?: number;
  disk?: number;
  maxdisk?: number;
  uptime?: number;
  tags?: string;
  raw: ProxmoxWorkload | ProxmoxVM | ProxmoxContainer;
};

type EditorState =
  | {
      type: "vm-compute";
      memoryMb: string;
      sockets: string;
      cores: string;
    }
  | {
      type: "vm-network";
      bridge: string;
      vlanTag: string;
    }
  | {
      type: "vm-disk";
      diskSizeGb: string;
    }
  | {
      type: "lxc-resources";
      memoryMb: string;
      swapMb: string;
      cores: string;
    }
  | {
      type: "lxc-network";
      bridge: string;
      vlanTag: string;
    }
  | {
      type: "lxc-disk";
      rootfsSizeGb: string;
    }
  | null;

function parseErrorMessage(error: unknown) {
  if (typeof error === "object" && error !== null) {
    const candidate = error as { body?: unknown; message?: unknown };
    if (typeof candidate.body === "string" && candidate.body) return candidate.body;
    if (typeof candidate.message === "string" && candidate.message) return candidate.message;
  }
  return "Request failed.";
}

function mapHostServerToNode(server: Awaited<ReturnType<typeof HostServersService.getHostServer>>): Node {
  return {
    ID: server.id || "",
    Hostname: server.hostname || "",
    IpAddress: String(server.ip_address || ""),
    hostServerTypeIds: Array.isArray(server.host_server_types) ? server.host_server_types.map((t) => t.id || "") : [],
    hostServerTypeNames: Array.isArray(server.host_server_types) ? server.host_server_types.map((t) => t.name || "") : [],
    platformTypeIds: Array.isArray(server.platform_types) ? server.platform_types.map((t) => t.id || "") : [],
    platformTypeNames: Array.isArray(server.platform_types) ? server.platform_types.map((t) => t.name || "") : [],
    LastModified: server.last_modified,
    Username: server.username,
  };
}

function normalizeKind(kind?: string): WorkloadKind | null {
  if (!kind) return null;
  const normalized = kind.toLowerCase();
  if (normalized.includes("qemu") || normalized.includes("vm")) return "qemu";
  if (normalized.includes("lxc") || normalized.includes("container")) return "lxc";
  return null;
}

function toExplorerItems(
  workloads: ProxmoxWorkload[],
  vms: ProxmoxVM[],
  containers: ProxmoxContainer[]
): ExplorerItem[] {
  if (workloads.length > 0) {
    return workloads
      .map((item) => {
        const kind = normalizeKind(item.kind);
        if (!kind) return null;
        return {
          id: `${kind}-${item.vmid ?? item.name}`,
          kind,
          label: item.name || `vm-${item.vmid ?? "unknown"}`,
          status: item.status,
          vmid: item.vmid,
          node: item.node,
          cpu: item.cpu,
          mem: item.mem,
          maxmem: item.maxmem,
          disk: item.disk,
          maxdisk: item.maxdisk,
          uptime: item.uptime,
          tags: item.tags,
          raw: item,
        } satisfies ExplorerItem;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }

  const vmItems: ExplorerItem[] = vms.map((item) => ({
    id: `qemu-${item.vmid ?? item.name}`,
    kind: "qemu",
    label: item.name || `vm-${item.vmid ?? "unknown"}`,
    status: item.status,
    vmid: item.vmid,
    node: item.node,
    cpu: item.cpu,
    mem: item.mem,
    maxmem: item.maxmem,
    disk: undefined,
    maxdisk: item.maxdisk,
    uptime: item.uptime,
    tags: item.tags,
    raw: item,
  }));

  const lxcItems: ExplorerItem[] = containers.map((item) => ({
    id: `lxc-${item.vmid ?? item.name}`,
    kind: "lxc",
    label: item.name || `lxc-${item.vmid ?? "unknown"}`,
    status: item.status,
    vmid: item.vmid,
    node: item.node,
    cpu: item.cpu,
    mem: item.mem,
    maxmem: item.maxmem,
    disk: item.disk,
    maxdisk: item.maxdisk,
    uptime: item.uptime,
    tags: item.tags,
    raw: item,
  }));

  return [...vmItems, ...lxcItems];
}

function formatBytesSafe(value?: number) {
  if (value === undefined || value === null) return "-";
  if (value >= 1024 * 1024 * 1024) return `${(value / 1024 / 1024 / 1024).toFixed(1)} GiB`;
  if (value >= 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)} MiB`;
  return `${value}`;
}

function formatUsage(used?: number, total?: number) {
  if (used === undefined && total === undefined) return "-";
  return `${formatBytesSafe(used)} / ${formatBytesSafe(total)}`;
}

function formatUptime(value?: number) {
  if (!value) return "-";
  const days = Math.floor(value / 86400);
  const hours = Math.floor((value % 86400) / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function isRunning(status?: string) {
  return status?.toLowerCase() === "running";
}

function sortExplorerItems(items: ExplorerItem[]) {
  return [...items].sort((a, b) => {
    const runningDelta = Number(isRunning(b.status)) - Number(isRunning(a.status));
    if (runningDelta !== 0) return runningDelta;
    return a.label.localeCompare(b.label);
  });
}

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function parseOptionalInt(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("Values must be positive integers.");
  }
  return parsed;
}

function formatCapacityMb(value?: number) {
  if (!value) return "-";
  if (value >= 1024) return `${(value / 1024).toFixed(value % 1024 === 0 ? 0 : 1)} GiB`;
  return `${value} MiB`;
}

function formatVlanTag(value?: string) {
  if (!value) return "No VLAN";
  return `VLAN ${value}`;
}

export default function ProxmoxManagerPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { nodeId } = useParams<{ nodeId: string }>();
  const seededNode = (location.state as { node?: Node } | null)?.node ?? null;

  const [node, setNode] = React.useState<Node | null>(seededNode);
  const [isLoadingNode, setIsLoadingNode] = React.useState(!seededNode);
  const [nodeError, setNodeError] = React.useState<string | null>(null);

  const [isLoadingInventory, setIsLoadingInventory] = React.useState(false);
  const [inventoryErrors, setInventoryErrors] = React.useState<InventoryErrors>({});
  const [workloads, setWorkloads] = React.useState<ProxmoxWorkload[]>([]);
  const [vms, setVms] = React.useState<ProxmoxVM[]>([]);
  const [containers, setContainers] = React.useState<ProxmoxContainer[]>([]);
  const [apiResult, setApiResult] = React.useState<unknown>(null);
  const [hostSummary, setHostSummary] = React.useState<HostSummary | null>(null);
  const [selectedItemId, setSelectedItemId] = React.useState<string>("host");
  const [expandedGroups, setExpandedGroups] = React.useState<Record<WorkloadKind, boolean>>({
    qemu: true,
    lxc: true,
  });
  const [actionBusyId, setActionBusyId] = React.useState<string | null>(null);

  const [isLoadingConfig, setIsLoadingConfig] = React.useState(false);
  const [configError, setConfigError] = React.useState<string | null>(null);
  const [vmHardware, setVmHardware] = React.useState<ProxmoxVMHardwareResult | null>(null);
  const [lxcResources, setLxcResources] = React.useState<ProxmoxLXCResourcesResult | null>(null);
  const [editorState, setEditorState] = React.useState<EditorState>(null);
  const [isSubmittingEditor, setIsSubmittingEditor] = React.useState(false);

  const hostServerId = node?.ID ?? nodeId ?? "";
  const hostLabel = node?.Hostname || node?.IpAddress || "Proxmox host";

  React.useEffect(() => {
    if (!nodeId) {
      setNodeError("Missing node id.");
      setIsLoadingNode(false);
      return;
    }
    if (seededNode?.ID === nodeId) {
      setNode(seededNode);
      setNodeError(null);
      setIsLoadingNode(false);
      return;
    }

    let cancelled = false;
    setIsLoadingNode(true);
    setNodeError(null);

    Promise.all([
      HostServersService.getHostServer(nodeId),
      hostStatsApi.getHostStats(nodeId).catch(() => null),
    ])
      .then(([server, stats]) => {
        if (cancelled) return;
        const mappedNode = mapHostServerToNode(server);
        mappedNode.stats = stats ?? undefined;
        setNode(mappedNode);
        setHostSummary(
          stats
            ? {
                cpuCores: stats.cpuCores,
                memoryTotalBytes: stats.memoryTotalBytes,
                storageTotalBytes: stats.storageTotalBytes,
                status: stats.status,
                error: stats.error,
              }
            : null
        );
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setNodeError(parseErrorMessage(error));
      })
      .finally(() => {
        if (!cancelled) setIsLoadingNode(false);
      });

    return () => {
      cancelled = true;
    };
  }, [nodeId, seededNode]);

  const applyInventorySnapshot = React.useCallback((snapshot: InventorySnapshot) => {
    setWorkloads(snapshot.workloads);
    setVms(snapshot.vms);
    setContainers(snapshot.containers);
    setInventoryErrors(snapshot.errors);
    if (snapshot.hostSummary) {
      setHostSummary(snapshot.hostSummary);
    }
  }, []);

  const loadInventorySnapshot = React.useCallback(async (): Promise<InventorySnapshot | null> => {
    if (!hostServerId) return null;

    const results = await Promise.allSettled([
      ProxmoxService.listProxmoxWorkloads(hostServerId, undefined, undefined, true),
      ProxmoxService.listProxmoxVMs(hostServerId, undefined, undefined, true),
      ProxmoxService.listProxmoxContainers(hostServerId, undefined, undefined, true),
      hostStatsApi.getHostStats(hostServerId).catch(() => null),
    ]);

    const nextErrors: InventoryErrors = {};

    const workloadsResult = results[0];
    let nextWorkloads: ProxmoxWorkload[] = [];
    if (workloadsResult.status === "fulfilled") {
      nextWorkloads = workloadsResult.value.workloads || [];
    } else {
      nextErrors.workloads = parseErrorMessage(workloadsResult.reason);
    }

    const vmsResult = results[1];
    let nextVms: ProxmoxVM[] = [];
    if (vmsResult.status === "fulfilled") {
      nextVms = vmsResult.value.vms || [];
    } else {
      nextErrors.vms = parseErrorMessage(vmsResult.reason);
    }

    const containersResult = results[2];
    let nextContainers: ProxmoxContainer[] = [];
    if (containersResult.status === "fulfilled") {
      nextContainers = containersResult.value.containers || [];
    } else {
      nextErrors.containers = parseErrorMessage(containersResult.reason);
    }

    const statsResult = results[3];
    let nextHostSummary: HostSummary | null | undefined;
    if (statsResult.status === "fulfilled" && statsResult.value) {
      nextHostSummary = {
        cpuCores: statsResult.value.cpuCores,
        memoryTotalBytes: statsResult.value.memoryTotalBytes,
        storageTotalBytes: statsResult.value.storageTotalBytes,
        status: statsResult.value.status,
        error: statsResult.value.error,
      };
    }

    return {
      workloads: nextWorkloads,
      vms: nextVms,
      containers: nextContainers,
      errors: nextErrors,
      hostSummary: nextHostSummary,
    };
  }, [hostServerId]);

  const refreshInventory = React.useCallback(
    async (options?: { silent?: boolean }) => {
      if (!hostServerId) return null;

      setIsLoadingInventory(true);
      const snapshot = await loadInventorySnapshot();
      if (!snapshot) {
        setIsLoadingInventory(false);
        return null;
      }

      applyInventorySnapshot(snapshot);
      if (!options?.silent && Object.keys(snapshot.errors).length > 0) {
        showWarningToast(
          "Some Proxmox inventory endpoints failed",
          "The explorer will keep rendering with whatever data is still available."
        );
      }
      setIsLoadingInventory(false);
      return snapshot;
    },
    [applyInventorySnapshot, hostServerId, loadInventorySnapshot]
  );

  React.useEffect(() => {
    if (!hostServerId) return;
    void refreshInventory();
  }, [hostServerId, refreshInventory]);

  const explorerItems = React.useMemo(
    () => sortExplorerItems(toExplorerItems(workloads, vms, containers)),
    [containers, vms, workloads]
  );

  const vmItems = React.useMemo(
    () => explorerItems.filter((item) => item.kind === "qemu"),
    [explorerItems]
  );
  const lxcItems = React.useMemo(
    () => explorerItems.filter((item) => item.kind === "lxc"),
    [explorerItems]
  );

  React.useEffect(() => {
    if (selectedItemId === "host") return;
    if (!explorerItems.some((item) => item.id === selectedItemId)) {
      setSelectedItemId("host");
    }
  }, [explorerItems, selectedItemId]);

  const selectedItem =
    selectedItemId === "host"
      ? null
      : explorerItems.find((item) => item.id === selectedItemId) ?? null;

  const loadSelectedConfig = React.useCallback(
    async (item: ExplorerItem | null, options?: { silent?: boolean }) => {
      if (!item?.vmid || !hostServerId) {
        setVmHardware(null);
        setLxcResources(null);
        setConfigError(null);
        setIsLoadingConfig(false);
        return null;
      }

      setIsLoadingConfig(true);
      setConfigError(null);
      try {
        if (item.kind === "qemu") {
          const result = await ProxmoxService.getProxmoxVmHardware(
            item.vmid,
            hostServerId,
            undefined,
            item.node
          );
          setVmHardware(result);
          setLxcResources(null);
          return result;
        }

        const result = await ProxmoxService.getProxmoxLxcResources(
          item.vmid,
          hostServerId,
          undefined,
          item.node
        );
        setLxcResources(result);
        setVmHardware(null);
        return result;
      } catch (error: unknown) {
        const message = parseErrorMessage(error);
        setConfigError(message);
        setVmHardware(null);
        setLxcResources(null);
        if (!options?.silent) {
          showErrorToast("Failed to load configured hardware", message);
        }
        return null;
      } finally {
        setIsLoadingConfig(false);
      }
    },
    [hostServerId]
  );

  React.useEffect(() => {
    if (!selectedItem) {
      setVmHardware(null);
      setLxcResources(null);
      setConfigError(null);
      setEditorState(null);
      return;
    }
    void loadSelectedConfig(selectedItem, { silent: true });
  }, [loadSelectedConfig, selectedItem]);

  const waitForInventoryCondition = React.useCallback(
    async (
      condition: (items: ExplorerItem[]) => boolean,
      options?: { timeoutMs?: number; intervalMs?: number }
    ) => {
      const timeoutMs = options?.timeoutMs ?? 15000;
      const intervalMs = options?.intervalMs ?? 1500;
      const deadline = Date.now() + timeoutMs;

      while (Date.now() < deadline) {
        await sleep(intervalMs);
        const snapshot = await refreshInventory({ silent: true });
        if (!snapshot) return false;

        const items = sortExplorerItems(
          toExplorerItems(snapshot.workloads, snapshot.vms, snapshot.containers)
        );
        if (condition(items)) {
          return true;
        }
      }

      return false;
    },
    [refreshInventory]
  );

  const refreshSelectedConfig = React.useCallback(async () => {
    if (!selectedItem) return;
    await loadSelectedConfig(selectedItem, { silent: true });
  }, [loadSelectedConfig, selectedItem]);

  const handleStart = React.useCallback(
    async (item: ExplorerItem) => {
      if (!item.vmid) {
        showErrorToast("Cannot start workload", "This item is missing a VMID.");
        return;
      }

      setActionBusyId(item.id);
      try {
        const request = {
          host_server_id: hostServerId,
          node: item.node,
          vmid: item.vmid,
        };
        const result =
          item.kind === "qemu"
            ? await ProxmoxService.startProxmoxVm(item.vmid, request)
            : await ProxmoxService.startProxmoxContainer(item.vmid, request);
        setApiResult(result);
        showSuccessToast(`Start requested for ${item.label}`, "Waiting for inventory to reflect the new state.");
        const synced = await waitForInventoryCondition(
          (items) => items.some((candidate) => candidate.id === item.id && isRunning(candidate.status))
        );
        if (!synced) {
          showInfoToast("Start still processing", "The workload task was accepted, but Proxmox has not reported the running state yet.");
          await refreshInventory({ silent: true });
        }
      } catch (error: unknown) {
        const message = parseErrorMessage(error);
        setApiResult({ error: message });
        showErrorToast(`Failed to start ${item.label}`, message);
      } finally {
        setActionBusyId(null);
      }
    },
    [hostServerId, refreshInventory, waitForInventoryCondition]
  );

  const handleStop = React.useCallback(
    async (item: ExplorerItem) => {
      if (!item.vmid) {
        showErrorToast("Cannot stop workload", "This item is missing a VMID.");
        return;
      }

      setActionBusyId(item.id);
      try {
        const request = {
          host_server_id: hostServerId,
          node: item.node,
          vmid: item.vmid,
        };
        const result =
          item.kind === "qemu"
            ? await ProxmoxService.stopProxmoxVm(item.vmid, request)
            : await ProxmoxService.stopProxmoxContainer(item.vmid, request);
        setApiResult(result);
        showSuccessToast(`Stop requested for ${item.label}`, "Waiting for inventory to reflect the new state.");
        const synced = await waitForInventoryCondition(
          (items) => items.some((candidate) => candidate.id === item.id && !isRunning(candidate.status))
        );
        if (!synced) {
          showInfoToast("Stop still processing", "The workload task was accepted, but Proxmox has not reported the stopped state yet.");
          await refreshInventory({ silent: true });
        }
      } catch (error: unknown) {
        const message = parseErrorMessage(error);
        setApiResult({ error: message });
        showErrorToast(`Failed to stop ${item.label}`, message);
      } finally {
        setActionBusyId(null);
      }
    },
    [hostServerId, refreshInventory, waitForInventoryCondition]
  );

  const handleDelete = React.useCallback(
    async (item: ExplorerItem) => {
      if (!item.vmid) {
        showErrorToast("Cannot delete workload", "This item is missing a VMID.");
        return;
      }

      const confirmed = window.confirm(
        `Delete ${item.label} (${item.kind.toUpperCase()} ${item.vmid})?\n\nThis action is destructive and cannot be undone.`
      );
      if (!confirmed) return;

      setActionBusyId(item.id);
      try {
        const request = {
          host_server_id: hostServerId,
          node: item.node,
          vmid: item.vmid,
        };
        const result =
          item.kind === "qemu"
            ? await ProxmoxService.deleteProxmoxVm(item.vmid, request)
            : await ProxmoxService.deleteProxmoxContainer(item.vmid, request);
        setApiResult(result);
        showSuccessToast(`Delete requested for ${item.label}`, "Waiting for the workload to disappear from inventory.");
        const deleted = await waitForInventoryCondition(
          (items) => !items.some((candidate) => candidate.id === item.id),
          { timeoutMs: 20000 }
        );
        if (!deleted) {
          showInfoToast("Delete still processing", "The delete task was accepted, but Proxmox still reports the workload.");
          await refreshInventory({ silent: true });
        }
      } catch (error: unknown) {
        const message = parseErrorMessage(error);
        setApiResult({ error: message });
        showErrorToast(`Failed to delete ${item.label}`, message);
      } finally {
        setActionBusyId(null);
      }
    },
    [hostServerId, refreshInventory, waitForInventoryCondition]
  );

  const handleContextAction = React.useCallback(
    async (action: "start" | "stop" | "inspect" | "delete", item: ExplorerItem) => {
      if (action === "inspect") {
        setSelectedItemId(item.id);
        return;
      }
      if (action === "start") {
        await handleStart(item);
        return;
      }
      if (action === "stop") {
        await handleStop(item);
        return;
      }
      await handleDelete(item);
    },
    [handleDelete, handleStart, handleStop]
  );

  const openEditor = React.useCallback(
    (mode: Exclude<EditorState, null>["type"]) => {
      if (!selectedItem) return;

      if (mode === "vm-compute" && vmHardware) {
        setEditorState({
          type: "vm-compute",
          memoryMb: String(vmHardware.memory_mb ?? ""),
          sockets: String(vmHardware.sockets ?? ""),
          cores: String(vmHardware.cores ?? ""),
        });
        return;
      }

      if (mode === "vm-network" && vmHardware) {
        setEditorState({
          type: "vm-network",
          bridge: vmHardware.bridge ?? "",
          vlanTag: vmHardware.vlan_tag ?? "",
        });
        return;
      }

      if (mode === "vm-disk" && vmHardware) {
        setEditorState({
          type: "vm-disk",
          diskSizeGb: String(parseOptionalDiskSize(vmHardware.disk_size) ?? ""),
        });
        return;
      }

      if (mode === "lxc-resources" && lxcResources) {
        setEditorState({
          type: "lxc-resources",
          memoryMb: String(lxcResources.memory_mb ?? ""),
          swapMb: String(lxcResources.swap_mb ?? ""),
          cores: String(lxcResources.cores ?? ""),
        });
        return;
      }

      if (mode === "lxc-network" && lxcResources) {
        setEditorState({
          type: "lxc-network",
          bridge: lxcResources.bridge ?? "",
          vlanTag: lxcResources.vlan_tag ?? "",
        });
        return;
      }

      if (mode === "lxc-disk" && lxcResources) {
        setEditorState({
          type: "lxc-disk",
          rootfsSizeGb: String(parseOptionalDiskSize(lxcResources.rootfs_size) ?? ""),
        });
      }
    },
    [lxcResources, selectedItem, vmHardware]
  );

  const submitEditor = React.useCallback(async () => {
    if (!editorState || !selectedItem?.vmid) return;

    setIsSubmittingEditor(true);
    try {
      if (editorState.type === "vm-compute") {
        const body: ProxmoxVMHardwareUpdateRequest = {
          host_server_id: hostServerId,
          node: selectedItem.node,
          vmid: selectedItem.vmid,
          memory_mb: parseOptionalInt(editorState.memoryMb),
          sockets: parseOptionalInt(editorState.sockets),
          cores: parseOptionalInt(editorState.cores),
        };
        const result = await ProxmoxService.updateProxmoxVmHardware(selectedItem.vmid, body);
        setVmHardware(result);
        setApiResult(result);
      } else if (editorState.type === "vm-network") {
        const bridge = editorState.bridge.trim();
        if (!bridge) {
          throw new Error("Bridge is required.");
        }
        const body: ProxmoxVMHardwareUpdateRequest = {
          host_server_id: hostServerId,
          node: selectedItem.node,
          vmid: selectedItem.vmid,
          bridge,
          vlan_tag: editorState.vlanTag.trim(),
        };
        const result = await ProxmoxService.updateProxmoxVmHardware(selectedItem.vmid, body);
        setVmHardware(result);
        setApiResult(result);
      } else if (editorState.type === "vm-disk") {
        const body: ProxmoxVMHardwareUpdateRequest = {
          host_server_id: hostServerId,
          node: selectedItem.node,
          vmid: selectedItem.vmid,
          disk_size_gb: parseOptionalInt(editorState.diskSizeGb),
        };
        const result = await ProxmoxService.updateProxmoxVmHardware(selectedItem.vmid, body);
        setVmHardware(result);
        setApiResult(result);
      } else if (editorState.type === "lxc-resources") {
        const body: ProxmoxLXCResourcesUpdateRequest = {
          host_server_id: hostServerId,
          node: selectedItem.node,
          vmid: selectedItem.vmid,
          memory_mb: parseOptionalInt(editorState.memoryMb),
          swap_mb: parseOptionalInt(editorState.swapMb),
          cores: parseOptionalInt(editorState.cores),
        };
        const result = await ProxmoxService.updateProxmoxLxcResources(selectedItem.vmid, body);
        setLxcResources(result);
        setApiResult(result);
      } else if (editorState.type === "lxc-network") {
        const bridge = editorState.bridge.trim();
        if (!bridge) {
          throw new Error("Bridge is required.");
        }
        const body: ProxmoxLXCResourcesUpdateRequest = {
          host_server_id: hostServerId,
          node: selectedItem.node,
          vmid: selectedItem.vmid,
          bridge,
          vlan_tag: editorState.vlanTag.trim(),
        };
        const result = await ProxmoxService.updateProxmoxLxcResources(selectedItem.vmid, body);
        setLxcResources(result);
        setApiResult(result);
      } else {
        const body: ProxmoxLXCResourcesUpdateRequest = {
          host_server_id: hostServerId,
          node: selectedItem.node,
          vmid: selectedItem.vmid,
          rootfs_size_gb: parseOptionalInt(editorState.rootfsSizeGb),
        };
        const result = await ProxmoxService.updateProxmoxLxcResources(selectedItem.vmid, body);
        setLxcResources(result);
        setApiResult(result);
      }

      setEditorState(null);
      showSuccessToast(
        selectedItem.kind === "qemu" ? "VM hardware updated" : "Container resources updated",
        "Refreshing workload inventory and configured values."
      );
      await Promise.all([
        refreshInventory({ silent: true }),
        sleep(800).then(() => refreshSelectedConfig()),
      ]);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : parseErrorMessage(error);
      setApiResult({ error: message });
      showErrorToast("Failed to update Proxmox configuration", message);
    } finally {
      setIsSubmittingEditor(false);
    }
  }, [editorState, hostServerId, refreshInventory, refreshSelectedConfig, selectedItem]);

  if (isLoadingNode) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
        Loading Proxmox explorer...
      </div>
    );
  }

  if (!node || nodeError) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 py-10">
        <Button variant="outline" onClick={() => navigate("/nodes/manage")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Managed Nodes
        </Button>
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6">
          <h1 className="text-xl font-semibold">Unable to load Proxmox workspace</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {nodeError || "The requested node could not be loaded."}
          </p>
        </div>
      </div>
    );
  }

  const hasInventoryErrors = Object.keys(inventoryErrors).length > 0;

  return (
    <>
      <div className="-mx-4 -mb-4 -mt-3 h-[calc(100vh-3.25rem)] overflow-hidden">
        <div className="grid h-full min-h-0 grid-cols-[340px_minmax(0,1fr)]">
          <aside className="flex min-h-0 flex-col border-r border-border/70 bg-background/80">
            <div className="space-y-3 px-2 py-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start px-2 text-muted-foreground"
                onClick={() => navigate("/nodes/manage")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Managed Nodes
              </Button>

              <button
                type="button"
                onClick={() => setSelectedItemId("host")}
                className={cn(
                  "flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition-colors",
                  selectedItemId === "host"
                    ? "border-primary/40 bg-primary/10"
                    : "border-border/60 bg-card/30 hover:bg-card/60"
                )}
              >
                <div className="mt-0.5 rounded-lg bg-primary/15 p-2 text-primary">
                  <Server className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold">{hostLabel}</span>
                    <StatusDot running={hostSummary?.status === "ok"} />
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {node.hostServerTypeNames.slice(0, 2).map((name) => (
                      <Badge key={name} variant="outline" className="rounded-full px-2 py-0 text-[10px]">
                        {name}
                      </Badge>
                    ))}
                    {node.platformTypeNames.slice(0, 2).map((name) => (
                      <Badge key={name} variant="secondary" className="rounded-full px-2 py-0 text-[10px]">
                        {name}
                      </Badge>
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">{node.IpAddress}</div>
                </div>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <MiniStat label="VMs" value={String(vmItems.length)} />
                <MiniStat label="LXCs" value={String(lxcItems.length)} />
                <MiniStat label="CPU" value={hostSummary?.cpuCores ? String(hostSummary.cpuCores) : "-"} />
                <MiniStat
                  label="Inventory"
                  value={hasInventoryErrors ? "Partial" : isLoadingInventory ? "Syncing" : "Ready"}
                  tone={hasInventoryErrors ? "warning" : "success"}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    void refreshInventory();
                    void refreshSelectedConfig();
                  }}
                  disabled={isLoadingInventory || isLoadingConfig}
                >
                  <RefreshCw
                    className={cn("mr-2 h-4 w-4", (isLoadingInventory || isLoadingConfig) && "animate-spin")}
                  />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="px-3"
                  onClick={() =>
                    showInfoToast(
                      "Tree explorer is the primary control surface",
                      "Right-click any VM or LXC for lifecycle commands. Select one to view and edit hardware or resource settings."
                    )
                  }
                >
                  <Info className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Separator />

            <ScrollArea className="min-h-0 flex-1">
              <div className="space-y-2 px-2 py-3">
                <TreeGroup
                  title="Virtual Machines"
                  kind="qemu"
                  count={vmItems.length}
                  open={expandedGroups.qemu}
                  onToggle={() => setExpandedGroups((prev) => ({ ...prev, qemu: !prev.qemu }))}
                >
                  {vmItems.map((item) => (
                    <TreeWorkloadItem
                      key={item.id}
                      item={item}
                      selected={selectedItemId === item.id}
                      busy={actionBusyId === item.id}
                      onSelect={() => setSelectedItemId(item.id)}
                      onInspect={() => setSelectedItemId(item.id)}
                      onStart={() => void handleContextAction("start", item)}
                      onStop={() => void handleContextAction("stop", item)}
                      onDelete={() => void handleContextAction("delete", item)}
                    />
                  ))}
                </TreeGroup>

                <TreeGroup
                  title="Containers"
                  kind="lxc"
                  count={lxcItems.length}
                  open={expandedGroups.lxc}
                  onToggle={() => setExpandedGroups((prev) => ({ ...prev, lxc: !prev.lxc }))}
                >
                  {lxcItems.map((item) => (
                    <TreeWorkloadItem
                      key={item.id}
                      item={item}
                      selected={selectedItemId === item.id}
                      busy={actionBusyId === item.id}
                      onSelect={() => setSelectedItemId(item.id)}
                      onInspect={() => setSelectedItemId(item.id)}
                      onStart={() => void handleContextAction("start", item)}
                      onStop={() => void handleContextAction("stop", item)}
                      onDelete={() => void handleContextAction("delete", item)}
                    />
                  ))}
                </TreeGroup>
              </div>
            </ScrollArea>
          </aside>

          <main className="min-h-0 overflow-hidden bg-background">
            <ScrollArea className="h-full">
              <div className="space-y-4 px-4 py-3">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
                        Proxmox Explorer
                      </Badge>
                      {selectedItem ? (
                        <Badge variant="secondary" className="uppercase">
                          {selectedItem.kind === "qemu" ? "Hardware" : "Resources"}
                        </Badge>
                      ) : null}
                      {hasInventoryErrors ? (
                        <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-200">
                          Partial inventory
                        </Badge>
                      ) : null}
                    </div>
                    <h1 className="mt-2 text-2xl font-semibold tracking-tight">
                      {selectedItem ? selectedItem.label : hostLabel}
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {selectedItem
                        ? selectedItem.kind === "qemu"
                          ? "Edit configured VM hardware without leaving the workload explorer."
                          : "Edit configured LXC resource and networking values from the same workspace."
                        : "Select a VM or LXC from the tree to inspect live stats and configured hardware."}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <HeaderMetric label="Workloads" value={String(explorerItems.length)} />
                    <HeaderMetric label="Running" value={String(explorerItems.filter((item) => isRunning(item.status)).length)} />
                    <HeaderMetric label="Memory" value={formatBytesSafe(hostSummary?.memoryTotalBytes)} />
                    <HeaderMetric label="Storage" value={formatBytesSafe(hostSummary?.storageTotalBytes)} />
                  </div>
                </div>

                {selectedItem ? (
                  <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                    <section className="space-y-4">
                      <div className="rounded-2xl border border-border/70 bg-card/40 p-4">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="flex items-start gap-3">
                            <div
                              className={cn(
                                "rounded-xl p-3",
                                selectedItem.kind === "qemu"
                                  ? "bg-sky-500/12 text-sky-300"
                                  : "bg-emerald-500/12 text-emerald-300"
                              )}
                            >
                              {selectedItem.kind === "qemu" ? (
                                <Server className="h-5 w-5" />
                              ) : (
                                <Boxes className="h-5 w-5" />
                              )}
                            </div>
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-xl font-semibold">{selectedItem.label}</h2>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "rounded-full px-2.5",
                                    isRunning(selectedItem.status)
                                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                                      : "border-zinc-500/30 bg-zinc-500/10 text-zinc-200"
                                  )}
                                >
                                  {selectedItem.status || "unknown"}
                                </Badge>
                                <Badge variant="secondary" className="rounded-full px-2.5 uppercase">
                                  {selectedItem.kind}
                                </Badge>
                              </div>
                              <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                                <span>VMID {selectedItem.vmid ?? "-"}</span>
                                <span>Node {selectedItem.node || hostLabel}</span>
                                <span>Uptime {formatUptime(selectedItem.uptime)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="outline"
                              className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => void handleDelete(selectedItem)}
                              disabled={actionBusyId === selectedItem.id}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </Button>
                            {isRunning(selectedItem.status) ? (
                              <Button
                                variant="outline"
                                onClick={() => void handleStop(selectedItem)}
                                disabled={actionBusyId === selectedItem.id}
                              >
                                <Power className="mr-2 h-4 w-4" />
                                Stop
                              </Button>
                            ) : (
                              <Button onClick={() => void handleStart(selectedItem)} disabled={actionBusyId === selectedItem.id}>
                                <Play className="mr-2 h-4 w-4" />
                                {actionBusyId === selectedItem.id ? "Starting..." : "Start"}
                              </Button>
                            )}
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                          <DetailStat icon={Cpu} label="CPU Usage" value={typeof selectedItem.cpu === "number" ? selectedItem.cpu.toFixed(2) : "-"} />
                          <DetailStat icon={Network} label="Memory" value={formatUsage(selectedItem.mem, selectedItem.maxmem)} />
                          <DetailStat icon={HardDrive} label="Disk" value={formatUsage(selectedItem.disk, selectedItem.maxdisk)} />
                          <DetailStat icon={Server} label="Runtime" value={formatUptime(selectedItem.uptime)} />
                        </div>
                      </div>

                      <div className="rounded-2xl border border-border/70 bg-card/40">
                        <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
                          <div>
                            <h3 className="text-lg font-semibold">
                              {selectedItem.kind === "qemu" ? "Hardware" : "Resources"}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {selectedItem.kind === "qemu"
                                ? "Configured VM values for memory, CPU topology, disk growth, and primary NIC."
                                : "Configured container values for memory, swap, cores, rootfs size, and primary NIC."}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void refreshSelectedConfig()}
                            disabled={isLoadingConfig}
                          >
                            <RefreshCw className={cn("mr-2 h-4 w-4", isLoadingConfig && "animate-spin")} />
                            Refresh Config
                          </Button>
                        </div>

                        {isLoadingConfig ? (
                          <div className="flex items-center gap-2 px-4 py-6 text-sm text-muted-foreground">
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                            Loading configured values from Proxmox...
                          </div>
                        ) : configError ? (
                          <div className="px-4 py-6 text-sm text-destructive">{configError}</div>
                        ) : selectedItem.kind === "qemu" && vmHardware ? (
                          <div className="divide-y divide-border/50">
                            <ConfigRow
                              title="Memory"
                              subtitle="Configured guest memory"
                              value={formatCapacityMb(vmHardware.memory_mb)}
                              actionLabel="Edit compute"
                              onAction={() => openEditor("vm-compute")}
                            />
                            <ConfigRow
                              title="Processors"
                              subtitle="Sockets and cores presented to the guest"
                              value={`${vmHardware.sockets ?? "-"} sockets • ${vmHardware.cores ?? "-"} cores`}
                              actionLabel="Edit compute"
                              onAction={() => openEditor("vm-compute")}
                            />
                            <ConfigRow
                              title={`Hard Disk${vmHardware.disk_interface ? ` (${vmHardware.disk_interface})` : ""}`}
                              subtitle="Primary virtual disk size"
                              value={vmHardware.disk_size || "-"}
                              actionLabel="Expand disk"
                              onAction={() => openEditor("vm-disk")}
                            />
                            <ConfigRow
                              title="Network Device"
                              subtitle={vmHardware.mac_address || "Primary interface networking"}
                              value={[
                                vmHardware.nic_model || "virtio",
                                vmHardware.bridge || "no bridge",
                                formatVlanTag(vmHardware.vlan_tag),
                              ].join(" • ")}
                              actionLabel="Edit network"
                              onAction={() => openEditor("vm-network")}
                            />
                          </div>
                        ) : selectedItem.kind === "lxc" && lxcResources ? (
                          <div className="divide-y divide-border/50">
                            <ConfigRow
                              title="Memory"
                              subtitle="Configured container memory limit"
                              value={formatCapacityMb(lxcResources.memory_mb)}
                              actionLabel="Edit resources"
                              onAction={() => openEditor("lxc-resources")}
                            />
                            <ConfigRow
                              title="Swap"
                              subtitle="Configured swap allocation"
                              value={formatCapacityMb(lxcResources.swap_mb)}
                              actionLabel="Edit resources"
                              onAction={() => openEditor("lxc-resources")}
                            />
                            <ConfigRow
                              title="Cores"
                              subtitle="Assigned CPU cores"
                              value={lxcResources.cores ? String(lxcResources.cores) : "-"}
                              actionLabel="Edit resources"
                              onAction={() => openEditor("lxc-resources")}
                            />
                            <ConfigRow
                              title="RootFS"
                              subtitle={lxcResources.storage || "Primary root filesystem volume"}
                              value={lxcResources.rootfs_size || lxcResources.rootfs || "-"}
                              actionLabel="Expand rootfs"
                              onAction={() => openEditor("lxc-disk")}
                            />
                            <ConfigRow
                              title="Network"
                              subtitle="Primary LXC interface"
                              value={[
                                lxcResources.bridge || "no bridge",
                                formatVlanTag(lxcResources.vlan_tag),
                              ].join(" • ")}
                              actionLabel="Edit network"
                              onAction={() => openEditor("lxc-network")}
                            />
                          </div>
                        ) : (
                          <div className="px-4 py-6 text-sm text-muted-foreground">
                            No configured values were returned for this workload.
                          </div>
                        )}
                      </div>
                    </section>

                    <section className="space-y-4">
                      <SideNote
                        title="Quick context"
                        lines={[
                          `Type: ${selectedItem.kind.toUpperCase()}`,
                          `Status: ${selectedItem.status || "unknown"}`,
                          `VMID: ${selectedItem.vmid ?? "-"}`,
                          `Host node: ${selectedItem.node || hostLabel}`,
                        ]}
                      />

                      {selectedItem.kind === "qemu" && vmHardware ? (
                        <SideNote
                          title="Hardware shortcuts"
                          lines={[
                            `Memory: ${formatCapacityMb(vmHardware.memory_mb)}`,
                            `CPU topology: ${vmHardware.sockets ?? "-"} sockets / ${vmHardware.cores ?? "-"} cores`,
                            `Disk: ${vmHardware.disk_size || "-"}`,
                            `Network: ${vmHardware.bridge || "no bridge"} / ${formatVlanTag(vmHardware.vlan_tag)}`,
                          ]}
                        />
                      ) : null}

                      {selectedItem.kind === "lxc" && lxcResources ? (
                        <SideNote
                          title="Resource shortcuts"
                          lines={[
                            `Memory: ${formatCapacityMb(lxcResources.memory_mb)}`,
                            `Swap: ${formatCapacityMb(lxcResources.swap_mb)}`,
                            `RootFS: ${lxcResources.rootfs_size || lxcResources.rootfs || "-"}`,
                            `Network: ${lxcResources.bridge || "no bridge"} / ${formatVlanTag(lxcResources.vlan_tag)}`,
                          ]}
                        />
                      ) : null}

                      <SideNote
                        title="Tags"
                        lines={
                          selectedItem.tags
                            ? selectedItem.tags.split(/[;, ]+/).filter(Boolean)
                            : ["No workload tags reported."]
                        }
                      />
                    </section>
                  </div>
                ) : (
                  <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                    <section className="rounded-2xl border border-border/70 bg-card/40 p-4">
                      <div className="flex items-start gap-3">
                        <div className="rounded-xl bg-primary/10 p-3 text-primary">
                          <Server className="h-5 w-5" />
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold">{hostLabel}</h2>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Select a VM or LXC from the tree to inspect its live state and edit its configured hardware or resources.
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <DetailStat icon={Cpu} label="CPU Cores" value={hostSummary?.cpuCores ? String(hostSummary.cpuCores) : "-"} />
                        <DetailStat icon={Network} label="Memory" value={formatBytesSafe(hostSummary?.memoryTotalBytes)} />
                        <DetailStat icon={HardDrive} label="Storage" value={formatBytesSafe(hostSummary?.storageTotalBytes)} />
                        <DetailStat icon={Server} label="Agent Status" value={hostSummary?.status || "-"} />
                      </div>

                      {hasInventoryErrors ? (
                        <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
                          <div className="font-medium">Inventory issues detected</div>
                          <ul className="mt-2 space-y-1 text-amber-50/90">
                            {inventoryErrors.workloads ? <li>Workloads: {inventoryErrors.workloads}</li> : null}
                            {inventoryErrors.vms ? <li>VMs: {inventoryErrors.vms}</li> : null}
                            {inventoryErrors.containers ? <li>Containers: {inventoryErrors.containers}</li> : null}
                          </ul>
                        </div>
                      ) : null}
                    </section>

                    <section className="space-y-4">
                      <SideNote
                        title="Explorer usage"
                        lines={[
                          "The left tree is the primary workload navigator.",
                          "Right-click a node for lifecycle commands.",
                          "Selecting a workload opens its hardware or resources view here.",
                          "Disk, CPU, memory, bridge, and VLAN changes now live in this pane.",
                        ]}
                      />
                    </section>
                  </div>
                )}

                <section className="rounded-2xl border border-border/70 bg-card/30 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Last API Response
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Latest payload returned from a workload action or hardware/resource update.
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setApiResult(null)}>
                      Clear
                    </Button>
                  </div>
                  <pre className="mt-3 overflow-auto rounded-xl border border-border/60 bg-background/40 p-4 text-xs leading-6">
                    {JSON.stringify(apiResult, null, 2)}
                  </pre>
                </section>
              </div>
            </ScrollArea>
          </main>
        </div>
      </div>

      <ConfigEditorDialog
        state={editorState}
        busy={isSubmittingEditor}
        onClose={() => setEditorState(null)}
        onSubmit={() => void submitEditor()}
        onChange={(next) => setEditorState(next)}
      />
    </>
  );
}

function TreeGroup({
  title,
  kind,
  count,
  open,
  onToggle,
  children,
}: React.PropsWithChildren<{
  title: string;
  kind: WorkloadKind;
  count: number;
  open: boolean;
  onToggle: () => void;
}>) {
  return (
    <div className="rounded-xl border border-border/50 bg-card/20">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-3 py-2 text-left"
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          {kind === "qemu" ? (
            <Server className="h-4 w-4 text-sky-300" />
          ) : (
            <Boxes className="h-4 w-4 text-emerald-300" />
          )}
          <span className="text-sm font-medium">{title}</span>
        </div>
        <Badge variant="outline" className="rounded-full px-2 py-0 text-[10px]">
          {count}
        </Badge>
      </button>
      {open ? <div className="space-y-1 px-2 pb-2">{children}</div> : null}
    </div>
  );
}

function TreeWorkloadItem({
  item,
  selected,
  busy,
  onSelect,
  onInspect,
  onStart,
  onStop,
  onDelete,
}: {
  item: ExplorerItem;
  selected: boolean;
  busy: boolean;
  onSelect: () => void;
  onInspect: () => void;
  onStart: () => void;
  onStop: () => void;
  onDelete: () => void;
}) {
  return (
    <ContextMenu
      onOpenChange={(open) => {
        if (open) onSelect();
      }}
    >
      <ContextMenuTrigger asChild>
        <button
          type="button"
          onClick={onSelect}
          className={cn(
            "relative flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left transition-colors",
            selected ? "bg-primary/10 text-foreground" : "hover:bg-accent/50"
          )}
        >
          <div className="mt-1 flex items-center gap-2">
            <span className="h-px w-3 bg-border/70" />
            <StatusDot running={isRunning(item.status)} busy={busy} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-medium">{item.label}</span>
              <span className="font-mono text-[10px] text-muted-foreground">{item.vmid ?? "-"}</span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <span>{item.node || "-"}</span>
              <span>•</span>
              <span>{item.kind.toUpperCase()}</span>
              <span>•</span>
              <span>{item.status || "unknown"}</span>
            </div>
          </div>
        </button>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-52">
        <ContextMenuLabel>{item.label}</ContextMenuLabel>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={onInspect}>
          <Info className="h-4 w-4" />
          Inspect
        </ContextMenuItem>
        {isRunning(item.status) ? (
          <ContextMenuItem onSelect={onStop}>
            <Power className="h-4 w-4" />
            Stop
          </ContextMenuItem>
        ) : (
          <ContextMenuItem onSelect={onStart}>
            <Play className="h-4 w-4" />
            Start
          </ContextMenuItem>
        )}
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive" onSelect={onDelete}>
          <Trash2 className="h-4 w-4" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function ConfigRow({
  title,
  subtitle,
  value,
  actionLabel,
  onAction,
}: {
  title: string;
  subtitle: string;
  value: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="grid gap-3 px-4 py-4 md:grid-cols-[200px_minmax(0,1fr)_auto] md:items-center">
      <div>
        <div className="text-sm font-medium">{title}</div>
        <div className="mt-1 text-xs text-muted-foreground">{subtitle}</div>
      </div>
      <div className="rounded-lg border border-border/50 bg-background/30 px-3 py-2 text-sm font-medium">
        {value}
      </div>
      <Button variant="outline" size="sm" onClick={onAction}>
        <PencilLine className="mr-2 h-4 w-4" />
        {actionLabel}
      </Button>
    </div>
  );
}

function ConfigEditorDialog({
  state,
  busy,
  onClose,
  onSubmit,
  onChange,
}: {
  state: EditorState;
  busy: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onChange: (state: EditorState) => void;
}) {
  const open = state !== null;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{editorTitle(state)}</DialogTitle>
          <DialogDescription>{editorDescription(state)}</DialogDescription>
        </DialogHeader>

        {state?.type === "vm-compute" ? (
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Memory (MiB)">
              <Input
                value={state.memoryMb}
                onChange={(event) => onChange({ ...state, memoryMb: event.target.value })}
                inputMode="numeric"
              />
            </Field>
            <Field label="Sockets">
              <Input
                value={state.sockets}
                onChange={(event) => onChange({ ...state, sockets: event.target.value })}
                inputMode="numeric"
              />
            </Field>
            <Field label="Cores">
              <Input
                value={state.cores}
                onChange={(event) => onChange({ ...state, cores: event.target.value })}
                inputMode="numeric"
              />
            </Field>
          </div>
        ) : null}

        {state?.type === "vm-network" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Bridge">
              <Input
                value={state.bridge}
                onChange={(event) => onChange({ ...state, bridge: event.target.value })}
                placeholder="vmbr0"
              />
            </Field>
            <Field label="VLAN Tag">
              <Input
                value={state.vlanTag}
                onChange={(event) => onChange({ ...state, vlanTag: event.target.value })}
                placeholder="Leave empty for untagged"
                inputMode="numeric"
              />
            </Field>
          </div>
        ) : null}

        {state?.type === "vm-disk" ? (
          <Field label="Disk Size (GiB)">
            <Input
              value={state.diskSizeGb}
              onChange={(event) => onChange({ ...state, diskSizeGb: event.target.value })}
              inputMode="numeric"
            />
          </Field>
        ) : null}

        {state?.type === "lxc-resources" ? (
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Memory (MiB)">
              <Input
                value={state.memoryMb}
                onChange={(event) => onChange({ ...state, memoryMb: event.target.value })}
                inputMode="numeric"
              />
            </Field>
            <Field label="Swap (MiB)">
              <Input
                value={state.swapMb}
                onChange={(event) => onChange({ ...state, swapMb: event.target.value })}
                inputMode="numeric"
              />
            </Field>
            <Field label="Cores">
              <Input
                value={state.cores}
                onChange={(event) => onChange({ ...state, cores: event.target.value })}
                inputMode="numeric"
              />
            </Field>
          </div>
        ) : null}

        {state?.type === "lxc-network" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Bridge">
              <Input
                value={state.bridge}
                onChange={(event) => onChange({ ...state, bridge: event.target.value })}
                placeholder="vmbr0"
              />
            </Field>
            <Field label="VLAN Tag">
              <Input
                value={state.vlanTag}
                onChange={(event) => onChange({ ...state, vlanTag: event.target.value })}
                placeholder="Leave empty for untagged"
                inputMode="numeric"
              />
            </Field>
          </div>
        ) : null}

        {state?.type === "lxc-disk" ? (
          <Field label="RootFS Size (GiB)">
            <Input
              value={state.rootfsSizeGb}
              onChange={(event) => onChange({ ...state, rootfsSizeGb: event.target.value })}
              inputMode="numeric"
            />
          </Field>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={busy}>
            {busy ? (
              <>
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                Saving
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function editorTitle(state: EditorState) {
  switch (state?.type) {
    case "vm-compute":
      return "Edit VM Compute";
    case "vm-network":
      return "Edit VM Network";
    case "vm-disk":
      return "Expand VM Disk";
    case "lxc-resources":
      return "Edit Container Resources";
    case "lxc-network":
      return "Edit Container Network";
    case "lxc-disk":
      return "Expand Container RootFS";
    default:
      return "Edit Configuration";
  }
}

function editorDescription(state: EditorState) {
  switch (state?.type) {
    case "vm-compute":
      return "Update the configured memory, socket count, and core count for this VM.";
    case "vm-network":
      return "Adjust the primary VM bridge and optional VLAN tag.";
    case "vm-disk":
      return "Increase the primary VM disk size in GiB.";
    case "lxc-resources":
      return "Update configured memory, swap, and CPU cores for this container.";
    case "lxc-network":
      return "Adjust the primary LXC bridge and optional VLAN tag.";
    case "lxc-disk":
      return "Increase the root filesystem size in GiB.";
    default:
      return "";
  }
}

function Field({
  label,
  children,
}: React.PropsWithChildren<{ label: string }>) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function StatusDot({ running, busy = false }: { running: boolean; busy?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex h-2.5 w-2.5 rounded-full",
        running ? "bg-emerald-400" : "bg-zinc-500",
        busy && "animate-pulse ring-4 ring-primary/20"
      )}
    />
  );
}

function MiniStat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "success" | "warning";
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-2",
        tone === "neutral" && "border-border/60 bg-card/30",
        tone === "success" && "border-emerald-500/20 bg-emerald-500/10",
        tone === "warning" && "border-amber-500/20 bg-amber-500/10"
      )}
    >
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  );
}

function HeaderMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/30 px-3 py-2">
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  );
}

function DetailStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/30 p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <div className="mt-3 text-lg font-semibold">{value}</div>
    </div>
  );
}

function SideNote({
  title,
  lines,
}: {
  title: string;
  lines: string[];
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card/30 p-4">
      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {title}
      </h3>
      <div className="mt-3 space-y-2 text-sm text-muted-foreground">
        {lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </div>
  );
}

function parseOptionalDiskSize(value?: string) {
  if (!value) return undefined;
  const match = value.match(/(\d+)/);
  if (!match) return undefined;
  const parsed = Number.parseInt(match[1], 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}
