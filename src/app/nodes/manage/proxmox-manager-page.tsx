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
  Network,
  Play,
  Power,
  RefreshCw,
  Server,
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { HostServersService } from "@/lib/api/services/HostServersService";
import { ProxmoxService } from "@/lib/api/services/ProxmoxService";
import { hostStatsApi } from "@/lib/host-stats-api";
import { cn } from "@/lib/utils";
import {
  showErrorToast,
  showInfoToast,
  showSuccessToast,
  showWarningToast,
} from "@/lib/toast-utils";
import type { Node } from "./columns";
import type { ProxmoxContainer } from "@/lib/api/models/ProxmoxContainer";
import type { ProxmoxVM } from "@/lib/api/models/ProxmoxVM";
import type { ProxmoxWorkload } from "@/lib/api/models/ProxmoxWorkload";

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
    kind: "qemu" as const,
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
    kind: "lxc" as const,
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

  const refreshInventory = React.useCallback(async () => {
    if (!hostServerId) return;

    setIsLoadingInventory(true);
    const results = await Promise.allSettled([
      ProxmoxService.listProxmoxWorkloads(hostServerId, undefined, undefined, true),
      ProxmoxService.listProxmoxVMs(hostServerId, undefined, undefined, true),
      ProxmoxService.listProxmoxContainers(hostServerId, undefined, undefined, true),
      hostStatsApi.getHostStats(hostServerId).catch(() => null),
    ]);

    const nextErrors: InventoryErrors = {};

    const workloadsResult = results[0];
    if (workloadsResult.status === "fulfilled") {
      setWorkloads(workloadsResult.value.workloads || []);
    } else {
      setWorkloads([]);
      nextErrors.workloads = parseErrorMessage(workloadsResult.reason);
    }

    const vmsResult = results[1];
    if (vmsResult.status === "fulfilled") {
      setVms(vmsResult.value.vms || []);
    } else {
      setVms([]);
      nextErrors.vms = parseErrorMessage(vmsResult.reason);
    }

    const containersResult = results[2];
    if (containersResult.status === "fulfilled") {
      setContainers(containersResult.value.containers || []);
    } else {
      setContainers([]);
      nextErrors.containers = parseErrorMessage(containersResult.reason);
    }

    const statsResult = results[3];
    if (statsResult.status === "fulfilled" && statsResult.value) {
      setHostSummary({
        cpuCores: statsResult.value.cpuCores,
        memoryTotalBytes: statsResult.value.memoryTotalBytes,
        storageTotalBytes: statsResult.value.storageTotalBytes,
        status: statsResult.value.status,
        error: statsResult.value.error,
      });
    }

    setInventoryErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      showWarningToast(
        "Some Proxmox inventory endpoints failed",
        "The explorer will keep rendering with whatever data is still available."
      );
    }
    setIsLoadingInventory(false);
  }, [hostServerId]);

  React.useEffect(() => {
    if (!hostServerId) return;
    refreshInventory();
  }, [hostServerId, refreshInventory]);

  const explorerItems = React.useMemo(
    () =>
      toExplorerItems(workloads, vms, containers).sort((a, b) => {
        const runningDelta = Number(isRunning(b.status)) - Number(isRunning(a.status));
        if (runningDelta !== 0) return runningDelta;
        return a.label.localeCompare(b.label);
      }),
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
          vmid: item.vmid,
        };
        const result =
          item.kind === "qemu"
            ? await ProxmoxService.startProxmoxVm(item.vmid, request)
            : await ProxmoxService.startProxmoxContainer(item.vmid, request);
        setApiResult(result);
        showSuccessToast(`Start requested for ${item.label}`, "Refreshing workload inventory.");
        await refreshInventory();
      } catch (error: unknown) {
        const message = parseErrorMessage(error);
        setApiResult({ error: message });
        showErrorToast(`Failed to start ${item.label}`, message);
      } finally {
        setActionBusyId(null);
      }
    },
    [hostServerId, refreshInventory]
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
          vmid: item.vmid,
        };
        const result =
          item.kind === "qemu"
            ? await ProxmoxService.stopProxmoxVm(item.vmid, request)
            : await ProxmoxService.stopProxmoxContainer(item.vmid, request);
        setApiResult(result);
        showSuccessToast(`Stop requested for ${item.label}`, "Refreshing workload inventory.");
        await refreshInventory();
      } catch (error: unknown) {
        const message = parseErrorMessage(error);
        setApiResult({ error: message });
        showErrorToast(`Failed to stop ${item.label}`, message);
      } finally {
        setActionBusyId(null);
      }
    },
    [hostServerId, refreshInventory]
  );

  const handleContextAction = React.useCallback(
    async (action: "start" | "stop" | "inspect", item: ExplorerItem) => {
      if (action === "inspect") {
        setSelectedItemId(item.id);
        return;
      }
      if (action === "start") {
        await handleStart(item);
        return;
      }
      handleStop(item);
    },
    [handleStart, handleStop]
  );

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
                onClick={refreshInventory}
                disabled={isLoadingInventory}
              >
                <RefreshCw className={cn("mr-2 h-4 w-4", isLoadingInventory && "animate-spin")} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="px-3"
                onClick={() =>
                  showInfoToast(
                    "Right-click any VM or LXC",
                    "Use the tree context menu for lifecycle actions and left-click to inspect details."
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
                onToggle={() =>
                  setExpandedGroups((prev) => ({ ...prev, qemu: !prev.qemu }))
                }
              >
                {vmItems.map((item) => (
                  <TreeWorkloadItem
                    key={item.id}
                    item={item}
                    selected={selectedItemId === item.id}
                    busy={actionBusyId === item.id}
                    onSelect={() => setSelectedItemId(item.id)}
                    onInspect={() => handleContextAction("inspect", item)}
                    onStart={() => void handleContextAction("start", item)}
                    onStop={() => void handleContextAction("stop", item)}
                  />
                ))}
              </TreeGroup>

              <TreeGroup
                title="Containers"
                kind="lxc"
                count={lxcItems.length}
                open={expandedGroups.lxc}
                onToggle={() =>
                  setExpandedGroups((prev) => ({ ...prev, lxc: !prev.lxc }))
                }
              >
                {lxcItems.map((item) => (
                  <TreeWorkloadItem
                    key={item.id}
                    item={item}
                    selected={selectedItemId === item.id}
                    busy={actionBusyId === item.id}
                    onSelect={() => setSelectedItemId(item.id)}
                    onInspect={() => handleContextAction("inspect", item)}
                    onStart={() => void handleContextAction("start", item)}
                    onStop={() => void handleContextAction("stop", item)}
                  />
                ))}
              </TreeGroup>
            </div>
          </ScrollArea>
        </aside>

        <main className="min-h-0 overflow-hidden bg-background">
          <ScrollArea className="h-full">
            <div className="space-y-5 px-4 py-3">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
                      Proxmox Explorer
                    </Badge>
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
                      ? "Workload details, live status, and instance-level quick actions."
                      : "Select a VM or LXC from the tree to inspect its details and run actions."}
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
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
                  <section className="rounded-2xl border border-border/70 bg-card/40 p-4">
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
                        {isRunning(selectedItem.status) ? (
                          <Button
                            variant="outline"
                            onClick={() => handleStop(selectedItem)}
                            disabled={actionBusyId === selectedItem.id}
                          >
                            <Power className="mr-2 h-4 w-4" />
                            Stop
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleStart(selectedItem)}
                            disabled={actionBusyId === selectedItem.id}
                          >
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

                    {selectedItem.tags ? (
                      <div className="mt-4">
                        <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Tags</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {selectedItem.tags.split(/[;, ]+/).filter(Boolean).map((tag) => (
                            <Badge key={tag} variant="outline" className="rounded-full px-2.5 py-0.5">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div className="mt-4 rounded-xl border border-border/60 bg-background/30 p-3">
                      <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        Raw workload payload
                      </div>
                      <pre className="mt-3 overflow-auto text-xs leading-6 text-muted-foreground">
                        {JSON.stringify(selectedItem.raw, null, 2)}
                      </pre>
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
                    <SideNote
                      title="Actions"
                      lines={[
                        "Left-click selects the workload.",
                        "Right-click opens workload commands.",
                        "Start and stop are available directly from the explorer.",
                        "Use right-click in the explorer for workload actions.",
                      ]}
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
                          Host overview for the selected Proxmox node. Choose a workload in the tree
                          to inspect instance-specific data.
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
                        "The left pane is now the primary workload navigator.",
                        "Running workloads are surfaced to the top of each group.",
                        "Use right-click for lifecycle commands.",
                        "The selected workload fills this details pane.",
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
                      Latest payload returned from a workload action or inventory call.
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
}: {
  item: ExplorerItem;
  selected: boolean;
  busy: boolean;
  onSelect: () => void;
  onInspect: () => void;
  onStart: () => void;
  onStop: () => void;
}) {
  return (
    <ContextMenu onOpenChange={(open) => {
      if (open) onSelect();
    }}>
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
      </ContextMenuContent>
    </ContextMenu>
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
