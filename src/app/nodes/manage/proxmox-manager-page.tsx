"use client";

import * as React from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Boxes,
  ChevronDown,
  ChevronRight,
  Check,
  CircleDot,
  Cloud,
  Copy,
  CopyPlus,
  Cpu,
  Disc3,
  ExternalLink,
  FileText,
  HardDrive,
  Info,
  LoaderCircle,
  MemoryStick,
  Network,
  PencilLine,
  Play,
  Plus,
  Power,
  RefreshCw,
  Router,
  Server,
  Settings,
  SquareTerminal,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import type { ProxmoxContainer } from "@/lib/api/models/ProxmoxContainer";
import type { ProxmoxGuestSummaryResult } from "@/lib/api/models/ProxmoxGuestSummaryResult";
import type { ProxmoxLXCResourcesResult } from "@/lib/api/models/ProxmoxLXCResourcesResult";
import type { ProxmoxLXCResourcesUpdateRequest } from "@/lib/api/models/ProxmoxLXCResourcesUpdateRequest";
import type { ProxmoxNodeOptionsResult } from "@/lib/api/models/ProxmoxNodeOptionsResult";
import type { ProxmoxVM } from "@/lib/api/models/ProxmoxVM";
import type { ProxmoxVMCreateRequest } from "@/lib/api/models/ProxmoxVMCreateRequest";
import type { ProxmoxVMHardwareActionRequest } from "@/lib/api/models/ProxmoxVMHardwareActionRequest";
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
import { ProxmoxTermProxyConsole } from "./terminal/proxmox-termproxy-console";
import { ProxmoxVncConsole } from "./terminal/proxmox-vnc-console";

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
  template?: number;
  raw: ProxmoxWorkload | ProxmoxVM | ProxmoxContainer;
};

type CloneVmState = {
  open: boolean;
  templateId: string;
  vmid: string;
  name: string;
  storage: string;
  memoryMb: string;
  sockets: string;
  cores: string;
  fullClone: boolean;
  start: boolean;
  ciUser: string;
  ciPassword: string;
  sshPublicKeys: string;
  ipconfig0: string;
  nameserver: string;
  searchDomain: string;
  ciSnippetsStorage: string;
  ciCustomScript: string;
  description: string;
};

type HardwareActionState = {
  open: boolean;
  title: string;
  device: string;
  value: string;
  delete: string;
};

type HardwareValueOption = {
  label: string;
  value: string;
  helper?: string;
};

type HardwareRow = {
  key: string;
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  removable: boolean;
  editable: boolean;
};

type EditorState =
  | {
      type: "vm-compute";
      memoryMb: string;
      minimumMemoryMb: string;
      shares: string;
      ballooningDevice: boolean;
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
          template: item.template,
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
    template: item.template,
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
    template: item.template,
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

function buildConsoleTitle(item: ExplorerItem) {
  if (item.kind === "lxc") {
    return `LXC ${item.vmid ?? "-"} Console`;
  }
  return `VM ${item.vmid ?? "-"} Console`;
}

function RenderWorkloadConsole({
  hostServerId,
  hostLabel,
  item,
  onClose,
  variant = "embedded",
}: {
  hostServerId: string;
  hostLabel: string;
  item: ExplorerItem;
  onClose: () => void;
  variant?: "embedded" | "focused";
}) {
  if (!item.vmid) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-border/70 bg-black/60 p-6 text-sm text-muted-foreground">
        This workload is missing a VMID.
      </div>
    );
  }

  if (item.kind === "lxc") {
    return (
      <ProxmoxTermProxyConsole
        hostServerId={hostServerId}
        vmid={item.vmid}
        node={item.node || hostLabel}
        title={buildConsoleTitle(item)}
        onClose={onClose}
        variant={variant}
      />
    );
  }

  return (
    <ProxmoxVncConsole
      hostServerId={hostServerId}
      vmid={item.vmid}
      node={item.node || hostLabel}
      title={buildConsoleTitle(item)}
      onClose={onClose}
      variant={variant}
    />
  );
}

function sortExplorerItems(items: ExplorerItem[]) {
  return [...items].sort((a, b) => {
    const templateDelta = Number(isTemplate(a)) - Number(isTemplate(b));
    if (templateDelta !== 0) return templateDelta;
    const runningDelta = Number(isRunning(b.status)) - Number(isRunning(a.status));
    if (runningDelta !== 0) return runningDelta;
    return a.label.localeCompare(b.label);
  });
}

function isTemplate(item?: ExplorerItem | null) {
  return item?.kind === "qemu" && Number(item.template || 0) > 0;
}

function isProxmoxNodeCandidate(node: Node) {
  const names = [...node.platformTypeNames, ...node.hostServerTypeNames].join(" ").toLowerCase();
  return names.includes("proxmox");
}

function defaultCloneState(template?: ExplorerItem | null): CloneVmState {
  return {
    open: false,
    templateId: template?.id || "",
    vmid: "",
    name: template ? `${template.label.replace(/template|cloudinit/gi, "").replace(/[-_]+$/g, "") || "vm"}-clone` : "",
    storage: "",
    memoryMb: "2048",
    sockets: "1",
    cores: "2",
    fullClone: true,
    start: false,
    ciUser: "",
    ciPassword: "",
    sshPublicKeys: "",
    ipconfig0: "ip=dhcp",
    nameserver: "",
    searchDomain: "",
    ciSnippetsStorage: "",
    ciCustomScript: "",
    description: "",
  };
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

function formatRawCapacityMb(value?: string) {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return value;
  return formatCapacityMb(parsed);
}

function formatVlanTag(value?: string) {
  if (!value) return "No VLAN";
  return `VLAN ${value}`;
}

function parseStringList(value: string) {
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function extractBridgeNames(...records: Array<Record<string, string> | undefined>) {
  const bridges = new Set<string>();
  records.forEach((record) => {
    Object.values(record || {}).forEach((value) => {
      const match = value.match(/(?:^|,)bridge=([^,]+)/);
      if (match?.[1]) bridges.add(match[1]);
    });
  });
  return [...bridges].sort();
}

function buildHardwareRows(vmHardware: ProxmoxVMHardwareResult | null): HardwareRow[] {
  const raw = vmHardware?.raw || {};
  const rows: HardwareRow[] = [];

  const addRow = (key: string, label: string, value?: string, icon: React.ComponentType<{ className?: string }> = Settings, removable = false, editable = true) => {
    if (!value) return;
    rows.push({ key, label, value, icon, removable, editable });
  };

  const memoryDetails = [
    vmHardware?.memory_mb ? formatCapacityMb(vmHardware.memory_mb) : formatRawCapacityMb(raw.memory),
    raw.balloon && raw.balloon !== "0" ? `minimum ${formatRawCapacityMb(raw.balloon) || `${raw.balloon} MiB`}` : null,
    raw.balloon === "0" ? "ballooning disabled" : null,
    raw.shares ? `shares ${raw.shares}` : null,
  ].filter(Boolean);
  addRow("memory", "Memory", memoryDetails.join(" / "), MemoryStick, false, false);
  addRow("cores", "Processors", `${vmHardware?.sockets ?? raw.sockets ?? "-"} socket(s), ${vmHardware?.cores ?? raw.cores ?? "-"} core(s)`, Cpu, false, false);
  addRow("bios", "BIOS", raw.bios, Settings);
  addRow("machine", "Machine", raw.machine, Settings);
  addRow("scsihw", "SCSI Controller", raw.scsihw, HardDrive);
  addRow("vga", "Display", raw.vga, Server);
  addRow("boot", "Boot Order", raw.boot, Settings);
  addRow("agent", "QEMU Guest Agent", raw.agent, Settings);

  Object.entries(raw)
    .filter(([key]) => /^(scsi|virtio|sata)\d+$/.test(key))
    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
    .forEach(([key, value]) => addRow(key, `Hard Disk (${key})`, value, HardDrive, true));

  Object.entries(raw)
    .filter(([key, value]) => /^ide\d+$/.test(key) && (value.includes("media=cdrom") || value.includes("cloudinit")))
    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
    .forEach(([key, value]) => addRow(key, value.includes("cloudinit") ? `CloudInit Drive (${key})` : `CD/DVD Drive (${key})`, value, value.includes("cloudinit") ? Cloud : Disc3, true));

  Object.entries(raw)
    .filter(([key]) => /^net\d+$/.test(key))
    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
    .forEach(([key, value]) => addRow(key, `Network Device (${key})`, value, Network, true));

  Object.entries(raw)
    .filter(([key]) => /^efidisk\d+$/.test(key))
    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
    .forEach(([key, value]) => addRow(key, `EFI Disk (${key})`, value, HardDrive, true));

  Object.entries(raw)
    .filter(([key]) => /^tpmstate\d+$/.test(key))
    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
    .forEach(([key, value]) => addRow(key, `TPM State (${key})`, value, Settings, true));

  Object.entries(raw)
    .filter(([key]) => /^(serial|usb|hostpci)\d+$/.test(key))
    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
    .forEach(([key, value]) => {
      const label = key.startsWith("serial") ? "Serial Port" : key.startsWith("usb") ? "USB Device" : "PCI Device";
      addRow(key, `${label} (${key})`, value, key.startsWith("serial") ? SquareTerminal : Plus, true);
    });

  return rows;
}

function hardwareFieldName(device: string) {
  if (/^net\d+$/.test(device)) return "Network model, bridge, VLAN, firewall, queues";
  if (/^(scsi|virtio|sata)\d+$/.test(device)) return "Storage volume, size, discard, SSD flag";
  if (/^ide\d+$/.test(device)) return "CD/DVD media or cloud-init volume";
  if (/^efidisk\d+$/.test(device)) return "EFI disk storage and key enrollment";
  if (/^tpmstate\d+$/.test(device)) return "TPM state storage and version";
  if (/^serial\d+$/.test(device)) return "Serial backend";
  if (/^usb\d+$/.test(device)) return "USB mapping";
  if (/^hostpci\d+$/.test(device)) return "PCI host mapping";
  if (device === "vga") return "Display adapter";
  if (device === "bios") return "BIOS";
  if (device === "machine") return "Machine type";
  if (device === "scsihw") return "SCSI controller";
  if (device === "agent") return "QEMU guest agent";
  if (device === "boot") return "Boot order";
  return "Proxmox config value";
}

function hardwareValueOptions(
  state: HardwareActionState,
  nodeOptions: ProxmoxNodeOptionsResult | null,
  bridgeOptions: string[]
): HardwareValueOption[] {
  const device = state.device.trim();
  const bridges = bridgeOptions.length ? bridgeOptions : ["vmbr0"];
  const storage = nodeOptions?.storage?.find((item) => item.content?.includes("images"))?.name || "local-lvm";
  const isoImages = nodeOptions?.iso_images || [];

  if (device === "vga") {
    return [
      { label: "SPICE", value: "qxl", helper: "PVE default for SPICE display." },
      { label: "VirtIO GPU", value: "virtio", helper: "Modern paravirtual display adapter." },
      { label: "Standard VGA", value: "std" },
      { label: "VMware compatible", value: "vmware" },
      { label: "Serial terminal", value: "serial0" },
      { label: "No display", value: "none" },
    ];
  }
  if (device === "bios") {
    return [
      { label: "OVMF (UEFI)", value: "ovmf" },
      { label: "SeaBIOS", value: "seabios" },
    ];
  }
  if (device === "machine") {
    return [
      { label: "q35", value: "q35" },
      { label: "i440fx", value: "pc-i440fx-9.0" },
    ];
  }
  if (device === "scsihw") {
    return [
      { label: "VirtIO SCSI single", value: "virtio-scsi-single" },
      { label: "VirtIO SCSI", value: "virtio-scsi-pci" },
      { label: "LSI 53C895A", value: "lsi" },
      { label: "MegaRAID SAS", value: "megasas" },
    ];
  }
  if (device === "agent") {
    return [
      { label: "Enabled", value: "enabled=1" },
      { label: "Enabled + trim cloned disks", value: "enabled=1,fstrim_cloned_disks=1" },
      { label: "Disabled", value: "0" },
    ];
  }
  if (/^net\d+$/.test(device)) {
    return bridges.flatMap((bridge) => [
      { label: `VirtIO on ${bridge}`, value: `virtio,bridge=${bridge}` },
      { label: `VirtIO on ${bridge}, firewall`, value: `virtio,bridge=${bridge},firewall=1` },
      { label: `E1000 on ${bridge}`, value: `e1000,bridge=${bridge}` },
    ]);
  }
  if (/^(scsi|virtio|sata)\d+$/.test(device)) {
    return [
      { label: `32 GiB on ${storage}`, value: `${storage}:32,discard=on,ssd=1` },
      { label: `64 GiB on ${storage}`, value: `${storage}:64,discard=on,ssd=1` },
      { label: `128 GiB on ${storage}`, value: `${storage}:128,discard=on,ssd=1` },
    ];
  }
  if (/^ide\d+$/.test(device)) {
    return [
      { label: "Empty CD/DVD", value: "none,media=cdrom" },
      ...isoImages.map((iso) => ({
        label: iso.volid || "ISO image",
        value: `${iso.volid},media=cdrom`,
      })),
      { label: `Cloud-init on ${storage}`, value: `${storage}:cloudinit` },
    ];
  }
  if (/^efidisk\d+$/.test(device)) {
    return [
      { label: `UEFI vars on ${storage}`, value: `${storage}:1,efitype=4m,pre-enrolled-keys=1` },
      { label: `UEFI vars without enrolled keys`, value: `${storage}:1,efitype=4m,pre-enrolled-keys=0` },
    ];
  }
  if (/^tpmstate\d+$/.test(device)) {
    return [{ label: `TPM 2.0 on ${storage}`, value: `${storage}:1,version=v2.0` }];
  }
  if (/^serial\d+$/.test(device)) {
    return [
      { label: "Socket", value: "socket" },
      { label: "Serial device", value: "/dev/ttyS0" },
    ];
  }
  if (/^usb\d+$/.test(device)) {
    return [
      { label: "Mapped USB device", value: "host=auto" },
      { label: "USB tablet", value: "tablet=1" },
    ];
  }
  if (/^hostpci\d+$/.test(device)) {
    return [
      { label: "PCI passthrough template", value: "host=0000:00:00.0" },
      { label: "PCI passthrough with PCIe", value: "host=0000:00:00.0,pcie=1" },
    ];
  }
  return [];
}

function percent(value?: number, max?: number) {
  if (!value || !max) return 0;
  return Math.max(0, Math.min(100, (value / max) * 100));
}

export default function ProxmoxManagerPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { nodeId } = useParams<{ nodeId: string }>();
  const seededNode = (location.state as { node?: Node } | null)?.node ?? null;
  const searchParams = React.useMemo(() => new URLSearchParams(location.search), [location.search]);
  const popoutConsoleId = searchParams.get("console");
  const isConsoleWindowRoute = location.pathname.startsWith("/console/proxmox/");
  const isConsolePopout = isConsoleWindowRoute && !!popoutConsoleId;

  const [node, setNode] = React.useState<Node | null>(seededNode);
  const [isLoadingNode, setIsLoadingNode] = React.useState(!seededNode);
  const [nodeError, setNodeError] = React.useState<string | null>(null);
  const [availableNodes, setAvailableNodes] = React.useState<Node[]>(seededNode ? [seededNode] : []);
  const [isLoadingAvailableNodes, setIsLoadingAvailableNodes] = React.useState(!seededNode);

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
  const [guestSummary, setGuestSummary] = React.useState<ProxmoxGuestSummaryResult | null>(null);
  const [nodeOptions, setNodeOptions] = React.useState<ProxmoxNodeOptionsResult | null>(null);
  const [editorState, setEditorState] = React.useState<EditorState>(null);
  const [isSubmittingEditor, setIsSubmittingEditor] = React.useState(false);
  const [cloneState, setCloneState] = React.useState<CloneVmState>(() => defaultCloneState());
  const [isSubmittingClone, setIsSubmittingClone] = React.useState(false);
  const [hardwareAction, setHardwareAction] = React.useState<HardwareActionState>({
    open: false,
    title: "",
    device: "",
    value: "",
    delete: "",
  });
  const [isSubmittingHardwareAction, setIsSubmittingHardwareAction] = React.useState(false);
  const [consoleItemId, setConsoleItemId] = React.useState<string | null>(popoutConsoleId);
  const [consoleSessionKey, setConsoleSessionKey] = React.useState(0);
  const requestFullscreen = React.useCallback(async () => {
    const element = document.documentElement;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }
    await element.requestFullscreen();
  }, []);

  const hostServerId = node?.ID ?? nodeId ?? "";
  const hostLabel = node?.Hostname || node?.IpAddress || "Proxmox host";
  const managerPath = hostServerId ? `/nodes/manage/${hostServerId}/proxmox` : "/nodes/manage";

  React.useEffect(() => {
    let cancelled = false;
    setIsLoadingAvailableNodes(true);
    HostServersService.getAllHostServers()
      .then((servers) => {
        if (cancelled) return;
        const proxmoxNodes = servers
          .map(mapHostServerToNode)
          .filter((candidate) => candidate.ID && isProxmoxNodeCandidate(candidate));
        setAvailableNodes(proxmoxNodes);
        if (!nodeId && proxmoxNodes[0]) {
          navigate(`/nodes/manage/${proxmoxNodes[0].ID}/proxmox`, {
            replace: true,
            state: { node: proxmoxNodes[0] },
          });
        }
      })
      .catch(() => {
        if (!cancelled && seededNode) setAvailableNodes([seededNode]);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingAvailableNodes(false);
      });
    return () => {
      cancelled = true;
    };
  }, [navigate, nodeId, seededNode]);

  React.useEffect(() => {
    if (!nodeId) {
      setNodeError(null);
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

      if (!options?.silent) {
        setIsLoadingInventory(true);
      }
      const snapshot = await loadInventorySnapshot();
      if (!snapshot) {
        if (!options?.silent) {
          setIsLoadingInventory(false);
        }
        return null;
      }

      applyInventorySnapshot(snapshot);
      if (!options?.silent && Object.keys(snapshot.errors).length > 0) {
        showWarningToast(
          "Some Proxmox inventory endpoints failed",
          "The explorer will keep rendering with whatever data is still available."
        );
      }
      if (!options?.silent) {
        setIsLoadingInventory(false);
      }
      return snapshot;
    },
    [applyInventorySnapshot, hostServerId, loadInventorySnapshot]
  );

  React.useEffect(() => {
    if (!hostServerId) return;
    void refreshInventory();
    ProxmoxService.getProxmoxNodeOptions(hostServerId)
      .then(setNodeOptions)
      .catch(() => setNodeOptions(null));
  }, [hostServerId, refreshInventory]);

  const explorerItems = React.useMemo(
    () => sortExplorerItems(toExplorerItems(workloads, vms, containers)),
    [containers, vms, workloads]
  );

  const vmItems = React.useMemo(
    () => explorerItems.filter((item) => item.kind === "qemu"),
    [explorerItems]
  );
  const templateItems = React.useMemo(
    () => vmItems.filter((item) => isTemplate(item)),
    [vmItems]
  );
  const lxcItems = React.useMemo(
    () => explorerItems.filter((item) => item.kind === "lxc"),
    [explorerItems]
  );
  const bridgeOptions = React.useMemo(() => {
    const bridges = new Set(["vmbr0"]);
    nodeOptions?.bridges?.forEach((bridge) => {
      if (bridge.name) bridges.add(bridge.name);
    });
    extractBridgeNames(vmHardware?.raw, lxcResources?.raw).forEach((bridge) => bridges.add(bridge));
    if (vmHardware?.bridge) bridges.add(vmHardware.bridge);
    if (lxcResources?.bridge) bridges.add(lxcResources.bridge);
    return [...bridges].sort();
  }, [lxcResources, nodeOptions, vmHardware]);
  React.useEffect(() => {
    if (selectedItemId === "host") return;
    if (!explorerItems.some((item) => item.id === selectedItemId)) {
      setSelectedItemId("host");
    }
  }, [explorerItems, selectedItemId]);

  React.useEffect(() => {
    if (isConsolePopout && popoutConsoleId) {
      const hasConsoleTarget = explorerItems.some((item) => item.id === popoutConsoleId);
      if (consoleItemId !== popoutConsoleId) {
        setConsoleItemId(popoutConsoleId);
      }
      if (selectedItemId !== popoutConsoleId && (explorerItems.length === 0 || hasConsoleTarget)) {
        setSelectedItemId(popoutConsoleId);
      }
      return;
    }
    if (consoleItemId && !explorerItems.some((item) => item.id === consoleItemId)) {
      setConsoleItemId(null);
    }
  }, [consoleItemId, explorerItems, isConsolePopout, popoutConsoleId, selectedItemId]);

  const selectedItem =
    selectedItemId === "host"
      ? null
      : explorerItems.find((item) => item.id === selectedItemId) ?? null;
  const selectedItemIsRunning = selectedItem ? isRunning(selectedItem.status) : false;
  const selectedItemIsTemplate = selectedItem ? isTemplate(selectedItem) : false;
  const consoleItem =
    consoleItemId === null ? null : explorerItems.find((item) => item.id === consoleItemId) ?? null;

  React.useEffect(() => {
    if (!isConsolePopout && consoleItemId && selectedItem && consoleItemId !== selectedItem.id) {
      setConsoleItemId(null);
    }
  }, [consoleItemId, isConsolePopout, selectedItem]);

  const openConsoleInPanel = React.useCallback((item: ExplorerItem) => {
    setSelectedItemId(item.id);
    setConsoleItemId(item.id);
    setConsoleSessionKey((prev) => prev + 1);
  }, []);

  const openConsoleInWindow = React.useCallback(
    (item: ExplorerItem) => {
      const url = `${window.location.origin}/console/proxmox/${encodeURIComponent(hostServerId)}?console=${encodeURIComponent(item.id)}`;
      const openedWindow = window.open(
        url,
        "_blank",
        "popup=yes,width=1440,height=960,resizable=yes,scrollbars=no"
      );
      if (!openedWindow) {
        showWarningToast(
          "Pop-out window was blocked",
          "Allow pop-ups for this site to open the Proxmox console in a separate window."
        );
      }
    },
    [hostServerId]
  );

  const loadSelectedConfig = React.useCallback(
    async (item: ExplorerItem | null, options?: { silent?: boolean }) => {
      if (!item?.vmid || !hostServerId) {
        setVmHardware(null);
        setLxcResources(null);
        setGuestSummary(null);
        setConfigError(null);
        setIsLoadingConfig(false);
        return null;
      }

      setIsLoadingConfig(true);
      setConfigError(null);
      try {
        if (item.kind === "qemu") {
          const [result, summary] = await Promise.all([
            ProxmoxService.getProxmoxVmHardware(
              item.vmid,
              hostServerId,
              undefined,
              item.node
            ),
            ProxmoxService.getProxmoxVmGuestSummary(
              item.vmid,
              hostServerId,
              undefined,
              item.node
            ),
          ]);
          setGuestSummary(summary);
          setVmHardware(result);
          setLxcResources(null);
          return result;
        }

        const [result, summary] = await Promise.all([
          ProxmoxService.getProxmoxLxcResources(
            item.vmid,
            hostServerId,
            undefined,
            item.node
          ),
          ProxmoxService.getProxmoxContainerGuestSummary(
            item.vmid,
            hostServerId,
            undefined,
            item.node
          ),
        ]);
        setGuestSummary(summary);
        setLxcResources(result);
        setVmHardware(null);
        return result;
      } catch (error: unknown) {
        const message = parseErrorMessage(error);
        setConfigError(message);
        setVmHardware(null);
        setLxcResources(null);
        setGuestSummary(null);
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

  React.useEffect(() => {
    if (!selectedItem?.vmid || !selectedItemIsRunning || selectedItemIsTemplate) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void refreshInventory({ silent: true });
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [refreshInventory, selectedItem?.id, selectedItem?.vmid, selectedItemIsRunning, selectedItemIsTemplate]);

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
    async (action: "start" | "stop" | "inspect" | "delete" | "clone", item: ExplorerItem) => {
      if (action === "inspect") {
        setSelectedItemId(item.id);
        return;
      }
      if (action === "clone") {
        setCloneState({ ...defaultCloneState(item), open: true });
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

  const submitClone = React.useCallback(async () => {
    const template = templateItems.find((item) => item.id === cloneState.templateId);
    if (!template?.vmid) {
      showErrorToast("Select a template", "Choose a QEMU VM template to clone from.");
      return;
    }
    if (!cloneState.name.trim()) {
      showErrorToast("Name is required", "Give the new VM a name before cloning.");
      return;
    }

    setIsSubmittingClone(true);
    try {
      const body: ProxmoxVMCreateRequest = {
        host_server_id: hostServerId,
        node: template.node || node?.Hostname || undefined,
        template_vmid: template.vmid,
        vmid: parseOptionalInt(cloneState.vmid),
        name: cloneState.name.trim(),
        storage: cloneState.storage.trim() || undefined,
        memory_mb: parseOptionalInt(cloneState.memoryMb),
        sockets: parseOptionalInt(cloneState.sockets),
        cores: parseOptionalInt(cloneState.cores),
        full_clone: cloneState.fullClone,
        start: cloneState.start,
        ci_user: cloneState.ciUser.trim() || undefined,
        ci_password: cloneState.ciPassword.trim() || undefined,
        ssh_public_keys: parseStringList(cloneState.sshPublicKeys),
        ipconfig0: cloneState.ipconfig0.trim() || undefined,
        nameserver: cloneState.nameserver.trim() || undefined,
        search_domain: cloneState.searchDomain.trim() || undefined,
        ci_snippets_storage: cloneState.ciSnippetsStorage.trim() || undefined,
        ci_custom_script: cloneState.ciCustomScript.trim() || undefined,
        description: cloneState.description.trim() || undefined,
      };
      const result = await ProxmoxService.createProxmoxVm(body);
      setApiResult(result);
      setCloneState(defaultCloneState());
      showSuccessToast("VM clone requested", "Refreshing Proxmox inventory for the new guest.");
      await waitForInventoryCondition(
        (items) => items.some((item) => item.kind === "qemu" && item.label === body.name),
        { timeoutMs: 20000 }
      );
      await refreshInventory({ silent: true });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : parseErrorMessage(error);
      setApiResult({ error: message });
      showErrorToast("Failed to clone VM", message);
    } finally {
      setIsSubmittingClone(false);
    }
  }, [cloneState, hostServerId, node?.Hostname, refreshInventory, templateItems, waitForInventoryCondition]);

  const openHardwareAction = React.useCallback((next: Partial<HardwareActionState>) => {
    setHardwareAction({
      open: true,
      title: next.title || "Apply Hardware Change",
      device: next.device || "",
      value: next.value || "",
      delete: next.delete || "",
    });
  }, []);

  const submitHardwareAction = React.useCallback(async () => {
    if (!selectedItem?.vmid || selectedItem.kind !== "qemu") return;
    setIsSubmittingHardwareAction(true);
    try {
      const body: ProxmoxVMHardwareActionRequest = {
        host_server_id: hostServerId,
        node: selectedItem.node,
        vmid: selectedItem.vmid,
        device: hardwareAction.device.trim() || undefined,
        value: hardwareAction.value.trim() || undefined,
        delete: hardwareAction.delete.trim() || undefined,
      };
      const result = await ProxmoxService.applyProxmoxVmHardwareAction(selectedItem.vmid, body);
      setVmHardware(result);
      setApiResult(result);
      setHardwareAction({ open: false, title: "", device: "", value: "", delete: "" });
      showSuccessToast("VM hardware updated", "The Proxmox hardware action was applied.");
      await refreshSelectedConfig();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : parseErrorMessage(error);
      setApiResult({ error: message });
      showErrorToast("Failed to apply hardware action", message);
    } finally {
      setIsSubmittingHardwareAction(false);
    }
  }, [hardwareAction, hostServerId, refreshSelectedConfig, selectedItem]);

  const openEditor = React.useCallback(
    (mode: Exclude<EditorState, null>["type"]) => {
      if (!selectedItem) return;

      if (mode === "vm-compute" && vmHardware) {
        setEditorState({
          type: "vm-compute",
          memoryMb: String(vmHardware.memory_mb ?? ""),
          minimumMemoryMb: vmHardware.raw?.balloon && vmHardware.raw.balloon !== "0" ? vmHardware.raw.balloon : "",
          shares: vmHardware.raw?.shares ?? "",
          ballooningDevice: vmHardware.raw?.balloon !== "0",
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
        const memoryMb = parseOptionalInt(editorState.memoryMb);
        const sockets = parseOptionalInt(editorState.sockets);
        const cores = parseOptionalInt(editorState.cores);
        const minimumMemoryMb = parseOptionalInt(editorState.minimumMemoryMb);
        const shares = parseOptionalInt(editorState.shares);
        if (!memoryMb) {
          throw new Error("Memory is required.");
        }
        if (!sockets) {
          throw new Error("Sockets is required.");
        }
        if (!cores) {
          throw new Error("Cores is required.");
        }
        if (minimumMemoryMb && minimumMemoryMb > memoryMb) {
          throw new Error("Minimum memory cannot be greater than configured memory.");
        }

        const params: Record<string, string> = {
          sockets: String(sockets),
          cores: String(cores),
        };
        if (editorState.ballooningDevice) {
          if (minimumMemoryMb) params.balloon = String(minimumMemoryMb);
        } else {
          params.balloon = "0";
        }
        if (shares) params.shares = String(shares);

        const body: ProxmoxVMHardwareActionRequest = {
          host_server_id: hostServerId,
          node: selectedItem.node,
          vmid: selectedItem.vmid,
          device: "memory",
          value: String(memoryMb),
          params,
        };
        const result = await ProxmoxService.applyProxmoxVmHardwareAction(selectedItem.vmid, body);
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

  if (isLoadingNode || (!nodeId && !node && isLoadingAvailableNodes)) {
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

  if (isConsolePopout) {
    if (!consoleItem && (isLoadingInventory || explorerItems.length === 0)) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
          Loading Proxmox console...
        </div>
      );
    }

    if (!consoleItem) {
      return (
        <div className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center space-y-4 px-6 py-10">
          <Button variant="outline" onClick={() => navigate(location.pathname, { replace: true })}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Proxmox Manager
          </Button>
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6">
            <h1 className="text-xl font-semibold">Workload console unavailable</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              The requested VM or container was not found in the latest Proxmox inventory for this node.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="h-screen bg-black text-foreground">
        <div className="absolute right-4 top-4 z-20 flex flex-wrap gap-2">
          <Button variant="secondary" className="bg-black/70 text-white hover:bg-black/85" onClick={() => void requestFullscreen()}>
            <SquareTerminal className="mr-2 h-4 w-4" />
            Fullscreen
          </Button>
          <Button variant="secondary" className="bg-black/70 text-white hover:bg-black/85" onClick={() => navigate(managerPath, { replace: true })}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Full Manager
          </Button>
          <Button variant="secondary" className="bg-black/70 text-white hover:bg-black/85" onClick={() => setConsoleSessionKey((prev) => prev + 1)}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reconnect
          </Button>
        </div>

        <div className="h-full p-0">
          <RenderWorkloadConsole
            key={`${consoleItem.id}-${consoleSessionKey}`}
            hostServerId={hostServerId}
            hostLabel={hostLabel}
            item={consoleItem}
            onClose={() => navigate(managerPath, { replace: true })}
            variant="focused"
          />
        </div>
      </div>
    );
  }

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

              <div className="space-y-2 rounded-xl border border-border/60 bg-card/30 p-3">
                <Label className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Proxmox node
                </Label>
                <Select
                  value={hostServerId}
                  onValueChange={(value) => {
                    const nextNode = availableNodes.find((candidate) => candidate.ID === value);
                    navigate(`/nodes/manage/${value}/proxmox`, {
                      state: nextNode ? { node: nextNode } : undefined,
                    });
                  }}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select a Proxmox node" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableNodes.map((candidate) => (
                      <SelectItem key={candidate.ID} value={candidate.ID}>
                        {candidate.Hostname || candidate.IpAddress}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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
                      onClone={() => void handleContextAction("clone", item)}
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
                      onClone={() => void handleContextAction("clone", item)}
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
                                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
                                      : "border-zinc-500/30 bg-zinc-500/10 text-zinc-700 dark:text-zinc-200"
                                  )}
                                >
                                  {selectedItem.status || "unknown"}
                                </Badge>
                                <Badge variant="secondary" className="rounded-full px-2.5 uppercase">
                                  {selectedItem.kind}
                                </Badge>
                                {isTemplate(selectedItem) ? (
                                  <Badge variant="outline" className="gap-1 rounded-full border-sky-500/30 bg-sky-500/10 px-2.5 text-sky-700 dark:text-sky-200">
                                    <FileText className="h-3 w-3" />
                                    VM template
                                  </Badge>
                                ) : null}
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
                              variant={consoleItemId === selectedItem.id ? "secondary" : "outline"}
                              onClick={() => openConsoleInPanel(selectedItem)}
                              disabled={!selectedItem.vmid || isTemplate(selectedItem)}
                            >
                              <SquareTerminal className="mr-2 h-4 w-4" />
                              {consoleItemId === selectedItem.id ? "Console Open" : "Open Console"}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => openConsoleInWindow(selectedItem)}
                              disabled={!selectedItem.vmid || isTemplate(selectedItem)}
                            >
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Pop Out
                            </Button>
                            <Button
                              variant="outline"
                              className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => void handleDelete(selectedItem)}
                              disabled={actionBusyId === selectedItem.id}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </Button>
                            {isTemplate(selectedItem) ? (
                              <Button onClick={() => setCloneState({ ...defaultCloneState(selectedItem), open: true })}>
                                <CopyPlus className="mr-2 h-4 w-4" />
                                Clone VM
                              </Button>
                            ) : isRunning(selectedItem.status) ? (
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

                      <GuestSummaryPanel
                        item={selectedItem}
                        vmHardware={vmHardware}
                        lxcResources={lxcResources}
                        guestSummary={guestSummary}
                        hostLabel={hostLabel}
                      />

                      {!isTemplate(selectedItem) ? (
                      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card/40">
                        <div className="flex items-start justify-between gap-3 border-b border-border/60 px-4 py-3">
                          <div>
                            <h3 className="text-lg font-semibold">Console</h3>
                            <p className="text-sm text-muted-foreground">
                              {selectedItem.kind === "lxc"
                                ? "Open the container console through Proxmox in the main workspace."
                                : "Open the VM display console through Proxmox in the main workspace."}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {consoleItemId === selectedItem.id ? (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setConsoleSessionKey((prev) => prev + 1)}
                                >
                                  <RefreshCw className="mr-2 h-4 w-4" />
                                  Reconnect
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openConsoleInWindow(selectedItem)}
                                >
                                  <ExternalLink className="mr-2 h-4 w-4" />
                                  Pop Out
                                </Button>
                              </>
                            ) : (
                              <Button size="sm" onClick={() => openConsoleInPanel(selectedItem)}>
                                <SquareTerminal className="mr-2 h-4 w-4" />
                                Open in Panel
                              </Button>
                            )}
                          </div>
                        </div>

                        {consoleItemId === selectedItem.id ? (
                          <>
                            <div className="h-[580px] p-3">
                              <RenderWorkloadConsole
                                key={`${selectedItem.id}-${consoleSessionKey}`}
                                hostServerId={hostServerId}
                                hostLabel={hostLabel}
                                item={selectedItem}
                                onClose={() => setConsoleItemId(null)}
                                variant="embedded"
                              />
                            </div>
                            <div className="border-t border-border/60 px-4 py-3 text-xs text-muted-foreground">
                              {selectedItem.kind === "qemu"
                                ? "This console is proxied from the Proxmox VM display websocket."
                                : "This console is proxied from the Proxmox container websocket."}
                            </div>
                          </>
                        ) : (
                          <div className="px-4 py-8 text-sm text-muted-foreground">
                            Open the workload console here, or pop it out into a separate window for a larger terminal.
                          </div>
                        )}
                      </div>
                      ) : null}

                      {selectedItem.kind === "lxc" ? (
                      <div className="rounded-2xl border border-border/70 bg-card/40">
                        <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
                          <div>
                            <h3 className="text-lg font-semibold">Resources</h3>
                            <p className="text-sm text-muted-foreground">
                              Configured container values for memory, swap, cores, rootfs size, and primary NIC.
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
                      ) : null}

                      {selectedItem.kind === "qemu" ? (
                        <HardwareCatalogPanel
                          nodeOptions={nodeOptions}
                          vmHardware={vmHardware}
                          onHardwareAction={openHardwareAction}
                          onEditCompute={() => openEditor("vm-compute")}
                          onEditNetwork={() => openEditor("vm-network")}
                          onExpandDisk={() => openEditor("vm-disk")}
                          onRefresh={() => void refreshSelectedConfig()}
                          isLoadingConfig={isLoadingConfig}
                          onCloneTemplate={() => setCloneState({ ...defaultCloneState(selectedItem), open: true })}
                          isTemplate={isTemplate(selectedItem)}
                        />
                      ) : null}
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
        bridgeOptions={bridgeOptions}
        onClose={() => setEditorState(null)}
        onSubmit={() => void submitEditor()}
        onChange={(next) => setEditorState(next)}
      />
      <CloneVmDialog
        state={cloneState}
        templates={templateItems}
        busy={isSubmittingClone}
        onClose={() => setCloneState(defaultCloneState())}
        onSubmit={() => void submitClone()}
        onChange={(next) => setCloneState(next)}
      />
      <HardwareActionDialog
        state={hardwareAction}
        busy={isSubmittingHardwareAction}
        nodeOptions={nodeOptions}
        bridgeOptions={bridgeOptions}
        onClose={() => setHardwareAction({ open: false, title: "", device: "", value: "", delete: "" })}
        onSubmit={() => void submitHardwareAction()}
        onChange={setHardwareAction}
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
  onClone,
  onDelete,
}: {
  item: ExplorerItem;
  selected: boolean;
  busy: boolean;
  onSelect: () => void;
  onInspect: () => void;
  onStart: () => void;
  onStop: () => void;
  onClone: () => void;
  onDelete: () => void;
}) {
  const template = isTemplate(item);
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
            selected ? "bg-primary/10 text-foreground" : "hover:bg-accent/50",
            template && "bg-muted/25 pl-4"
          )}
        >
          {template ? <span aria-hidden="true" className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-sky-400/70" /> : null}
          <div className="mt-1 flex items-center gap-2">
            <span className="h-px w-3 bg-border/70" />
            <StatusDot running={isRunning(item.status)} busy={busy} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-medium">{item.label}</span>
              <span className="font-mono text-[10px] text-muted-foreground">{item.vmid ?? "-"}</span>
              {template ? (
                <Badge variant="outline" className="gap-1 border-sky-500/30 bg-sky-500/10 px-1.5 py-0 text-[9px] text-sky-700 dark:text-sky-200">
                  <FileText className="h-2.5 w-2.5" />
                  template
                </Badge>
              ) : null}
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
        {template ? (
          <ContextMenuItem onSelect={onClone}>
            <CopyPlus className="h-4 w-4" />
            Clone VM
          </ContextMenuItem>
        ) : isRunning(item.status) ? (
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
  bridgeOptions,
  onClose,
  onSubmit,
  onChange,
}: {
  state: EditorState;
  busy: boolean;
  bridgeOptions: string[];
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
          <div className="space-y-5">
            <div className="rounded-xl border border-border/60 p-4">
              <div className="mb-3 text-sm font-semibold">Memory</div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Memory (MiB)">
                  <Input
                    value={state.memoryMb}
                    onChange={(event) => onChange({ ...state, memoryMb: event.target.value })}
                    inputMode="numeric"
                    placeholder="2048"
                  />
                </Field>
                <Field label="Minimum Memory (MiB)">
                  <Input
                    value={state.minimumMemoryMb}
                    onChange={(event) => onChange({ ...state, minimumMemoryMb: event.target.value, ballooningDevice: true })}
                    inputMode="numeric"
                    placeholder="Optional, enables ballooning"
                    disabled={!state.ballooningDevice}
                  />
                </Field>
                <Field label="Shares">
                  <Input
                    value={state.shares}
                    onChange={(event) => onChange({ ...state, shares: event.target.value })}
                    inputMode="numeric"
                    placeholder="Default 1000"
                  />
                </Field>
                <label className="flex items-center gap-2 self-end rounded-lg border border-border/60 px-3 py-2 text-sm">
                  <Checkbox
                    checked={state.ballooningDevice}
                    onCheckedChange={(checked) => onChange({ ...state, ballooningDevice: checked === true })}
                  />
                  Ballooning device
                </label>
              </div>
            </div>
            <div className="rounded-xl border border-border/60 p-4">
              <div className="mb-3 text-sm font-semibold">Processors</div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Sockets">
                  <Input
                    value={state.sockets}
                    onChange={(event) => onChange({ ...state, sockets: event.target.value })}
                    inputMode="numeric"
                    placeholder="1"
                  />
                </Field>
                <Field label="Cores">
                  <Input
                    value={state.cores}
                    onChange={(event) => onChange({ ...state, cores: event.target.value })}
                    inputMode="numeric"
                    placeholder="2"
                  />
                </Field>
              </div>
            </div>
          </div>
        ) : null}

        {state?.type === "vm-network" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Bridge">
              <BridgeSelect
                value={state.bridge}
                options={bridgeOptions}
                onChange={(bridge) => onChange({ ...state, bridge })}
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
              <BridgeSelect
                value={state.bridge}
                options={bridgeOptions}
                onChange={(bridge) => onChange({ ...state, bridge })}
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

function GuestSummaryPanel({
  item,
  vmHardware,
  lxcResources,
  guestSummary,
  hostLabel,
}: {
  item: ExplorerItem;
  vmHardware: ProxmoxVMHardwareResult | null;
  lxcResources: ProxmoxLXCResourcesResult | null;
  guestSummary: ProxmoxGuestSummaryResult | null;
  hostLabel: string;
}) {
  const notes = item.kind === "qemu" ? vmHardware?.raw?.description : lxcResources?.raw?.description;
  const ips = guestSummary?.ip_addresses || [];
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-2xl border border-border/70 bg-card/40 p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold">Guest Summary</h3>
          <Badge variant="outline" className="rounded-full">
            {isTemplate(item) ? "template" : item.status || "unknown"}
          </Badge>
        </div>
        <div className="mt-4 space-y-3">
          <SummaryLine icon={CircleDot} label="Status" value={item.status || "unknown"} />
          <SummaryLine icon={Server} label="Node" value={item.node || hostLabel} />
          <SummaryMeter icon={Cpu} label="CPU usage" value={`${((item.cpu || 0) * 100).toFixed(2)}%`} amount={(item.cpu || 0) * 100} />
          <SummaryMeter icon={MemoryStick} label="Memory usage" value={formatUsage(item.mem, item.maxmem)} amount={percent(item.mem, item.maxmem)} />
          <SummaryLine icon={HardDrive} label="Bootdisk size" value={item.kind === "qemu" ? vmHardware?.disk_size || formatBytesSafe(item.maxdisk) : lxcResources?.rootfs_size || formatBytesSafe(item.maxdisk)} />
          <SummaryLine icon={Router} label="Network" value={item.kind === "qemu" ? `${vmHardware?.bridge || "no bridge"} / ${formatVlanTag(vmHardware?.vlan_tag)}` : `${lxcResources?.bridge || "no bridge"} / ${formatVlanTag(lxcResources?.vlan_tag)}`} />
          <SummaryIpList ips={ips} fallback={guestSummary?.error ? "Guest agent unavailable" : "No IPs reported"} />
        </div>
      </section>

      <section className="rounded-2xl border border-border/70 bg-card/40 p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold">Notes</h3>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="mt-4 min-h-36 rounded-xl border border-border/60 bg-background/30 p-3 text-sm text-muted-foreground">
          {notes || "No guest notes reported by Proxmox."}
        </div>
      </section>
    </div>
  );
}

function SummaryIpList({
  ips,
  fallback,
}: {
  ips: string[];
  fallback: string;
}) {
  const visibleIps = ips.slice(0, 2);
  const hiddenIps = ips.slice(2);

  return (
    <div className="grid grid-cols-[24px_150px_minmax(0,1fr)] items-start gap-2 text-sm">
      <Router className="mt-1 h-4 w-4 text-muted-foreground" />
      <span className="mt-0.5 text-muted-foreground">IPs</span>
      <div className="flex min-w-0 justify-end">
        {ips.length > 0 ? (
          <div className="flex max-w-full items-center justify-end gap-1.5">
            <div className="flex min-w-0 items-center justify-end gap-1.5 overflow-hidden">
              {visibleIps.map((ip) => (
                <IpAddressChip
                  key={ip}
                  ip={ip}
                  className="min-w-0 max-w-[10rem] xl:max-w-[13rem]"
                />
              ))}
            </div>
            {hiddenIps.length > 0 ? (
              <IpPopover
                trigger={
                  <button
                    type="button"
                    className="rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 font-mono text-xs font-medium text-primary outline-none ring-offset-background transition hover:bg-primary/15 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    aria-label={`Show ${hiddenIps.length} more IP addresses`}
                  >
                    +{hiddenIps.length} more
                  </button>
                }
                contentClassName="w-80 max-w-[min(80vw,22rem)] p-3"
              >
                <>
                  <div className="mb-2 text-xs font-semibold text-muted-foreground">IP addresses</div>
                  <div className="max-h-56 space-y-1 overflow-auto pr-1">
                    {ips.map((ip) => (
                      <IpAddressPopoverRow key={ip} ip={ip} />
                    ))}
                  </div>
                </>
              </IpPopover>
            ) : null}
          </div>
        ) : (
          <div className="truncate text-right font-medium text-muted-foreground" title={fallback}>
            {fallback}
          </div>
        )}
      </div>
    </div>
  );
}

function IpPopover({
  trigger,
  children,
  contentClassName,
}: {
  trigger: React.ReactElement;
  children: React.ReactNode;
  contentClassName?: string;
}) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <span
        className="inline-flex"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      </span>
      <PopoverContent
        align="end"
        side="bottom"
        sideOffset={8}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className={cn("font-mono text-xs", contentClassName)}
      >
        {children}
      </PopoverContent>
    </Popover>
  );
}

async function copyIpAddress(ip: string) {
  await navigator.clipboard.writeText(ip);
}

function CopyIpButton({
  ip,
  className,
}: {
  ip: string;
  className?: string;
}) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = React.useCallback(async () => {
    try {
      await copyIpAddress(ip);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch (error) {
      showErrorToast("Could not copy IP address", parseErrorMessage(error));
    }
  }, [ip]);

  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border/70 bg-background/70 text-muted-foreground outline-none ring-offset-background transition hover:bg-background hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      aria-label={`Copy ${ip}`}
      onClick={handleCopy}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function IpAddressPopoverRow({ ip }: { ip: string }) {
  return (
    <div className="flex items-start gap-2 rounded-md px-1 py-1 hover:bg-muted/50">
      <div className="min-w-0 flex-1 break-all font-mono text-xs leading-5">{ip}</div>
      <CopyIpButton ip={ip} />
    </div>
  );
}

function IpAddressChip({
  ip,
  className,
}: {
  ip: string;
  className?: string;
}) {
  return (
    <IpPopover
      trigger={
        <button
          type="button"
          className={cn(
            "min-w-0 truncate rounded-md border border-border/70 bg-background/60 px-2 py-0.5 font-mono text-xs font-medium text-foreground outline-none ring-offset-background transition hover:bg-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            className
          )}
          aria-label={`Show full IP address ${ip}`}
        >
          {ip}
        </button>
      }
      contentClassName="max-w-[min(80vw,24rem)] px-3 py-2"
    >
      <IpAddressPopoverRow ip={ip} />
    </IpPopover>
  );
}

function SummaryLine({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="grid grid-cols-[24px_150px_minmax(0,1fr)] items-center gap-2 text-sm">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate text-right font-medium">{value}</span>
    </div>
  );
}

function SummaryMeter({
  icon,
  label,
  value,
  amount,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  amount: number;
}) {
  return (
    <div className="space-y-1.5">
      <SummaryLine icon={icon} label={label} value={value} />
      <div className="ml-8 h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(2, Math.min(100, amount))}%` }} />
      </div>
    </div>
  );
}

const hardwareOptions = [
  { label: "Hard Disk", icon: HardDrive, device: "{next:scsi}", value: "local-lvm:32,discard=on,ssd=1", helper: "Creates or updates a virtual disk slot." },
  { label: "CD/DVD Drive", icon: Disc3, device: "ide2", value: "none,media=cdrom", helper: "Attach, change, or clear ISO media." },
  { label: "Network Device", icon: Network, device: "{next:net}", value: "virtio,bridge=vmbr0", helper: "Adds another virtual NIC." },
  { label: "EFI Disk", icon: HardDrive, device: "efidisk0", value: "local-lvm:1,efitype=4m,pre-enrolled-keys=1", helper: "Adds or updates UEFI variable storage." },
  { label: "TPM State", icon: Settings, device: "tpmstate0", value: "local-lvm:1,version=v2.0", helper: "Adds TPM 2.0 state storage." },
  { label: "USB Device", icon: Plus, device: "{next:usb}", value: "host=auto", helper: "Adds a USB mapping." },
  { label: "PCI Device", icon: Plus, device: "{next:hostpci}", value: "host=0000:00:00.0", helper: "Adds PCI passthrough config." },
  { label: "Serial Port", icon: SquareTerminal, device: "{next:serial}", value: "socket", helper: "Adds a serial socket." },
  { label: "CloudInit Drive", icon: Cloud, device: "ide2", value: "local-lvm:cloudinit", helper: "Adds or moves the cloud-init drive." },
];

function HardwareCatalogPanel({
  nodeOptions,
  vmHardware,
  onHardwareAction,
  onEditCompute,
  onEditNetwork,
  onExpandDisk,
  onRefresh,
  isLoadingConfig,
  onCloneTemplate,
  isTemplate,
}: {
  nodeOptions: ProxmoxNodeOptionsResult | null;
  vmHardware: ProxmoxVMHardwareResult | null;
  onHardwareAction: (state: Partial<HardwareActionState>) => void;
  onEditCompute: () => void;
  onEditNetwork: () => void;
  onExpandDisk: () => void;
  onRefresh: () => void;
  isLoadingConfig: boolean;
  onCloneTemplate: () => void;
  isTemplate: boolean;
}) {
  const isoImages = nodeOptions?.iso_images || [];
  const rows = buildHardwareRows(vmHardware);
  const nextDeviceFor = (prefix: string) => {
    const raw = vmHardware?.raw || {};
    for (let index = 0; index < 32; index += 1) {
      const key = `${prefix}${index}`;
      if (!raw[key]) return key;
    }
    return `${prefix}0`;
  };
  return (
    <section className="rounded-2xl border border-border/70 bg-card/40">
      <div className="flex flex-col gap-3 border-b border-border/60 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-lg font-semibold">Hardware & Media</h3>
          <p className="text-sm text-muted-foreground">
            Current QEMU hardware configuration from Proxmox.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoadingConfig}>
            <RefreshCw className={cn("mr-2 h-4 w-4", isLoadingConfig && "animate-spin")} />
            Refresh
          </Button>
          <Select
            onValueChange={(value) => {
              const option = hardwareOptions.find((item) => item.label === value);
              if (!option) return;
              const device = option.device.includes("{next:")
                ? nextDeviceFor(option.device.replace("{next:", "").replace("}", ""))
                : option.device;
              onHardwareAction({ title: `Add ${option.label}`, device, value: option.value });
            }}
          >
            <SelectTrigger className="w-52">
              <SelectValue placeholder="Add hardware" />
            </SelectTrigger>
            <SelectContent>
              {hardwareOptions.map((option) => (
                <SelectItem key={option.label} value={option.label}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isTemplate ? (
            <Button onClick={onCloneTemplate}>
              <CopyPlus className="mr-2 h-4 w-4" />
              Clone
            </Button>
          ) : null}
        </div>
      </div>
      <div className="divide-y divide-border/50">
        {rows.length > 0 ? (
          rows.map((row) => (
            <div key={row.key} className="grid gap-3 px-4 py-3 lg:grid-cols-[260px_minmax(0,1fr)_auto] lg:items-center">
              <div className="flex min-w-0 items-center gap-3">
                <row.icon className="h-4 w-4 text-primary" />
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{row.label}</div>
                  <div className="font-mono text-[11px] text-muted-foreground">{row.key}</div>
                </div>
              </div>
              <div className="min-w-0 rounded-lg border border-border/50 bg-background/30 px-3 py-2 font-mono text-xs text-muted-foreground">
                <span className="block truncate">{row.value}</span>
              </div>
              <div className="flex justify-end gap-2">
                {row.key === "memory" || row.key === "cores" ? (
                  <Button variant="outline" size="sm" onClick={onEditCompute}>
                    <PencilLine className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                ) : /^net0$/.test(row.key) ? (
                  <Button variant="outline" size="sm" onClick={onEditNetwork}>
                    <PencilLine className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                ) : row.key === vmHardware?.disk_interface ? (
                  <Button variant="outline" size="sm" onClick={onExpandDisk}>
                    <PencilLine className="mr-2 h-4 w-4" />
                    Expand
                  </Button>
                ) : row.editable ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onHardwareAction({ title: `Edit ${row.label}`, device: row.key, value: row.value })}
                  >
                    <PencilLine className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                ) : null}
                {row.removable ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => onHardwareAction({ title: `Remove ${row.label}`, delete: row.key })}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </Button>
                ) : null}
              </div>
            </div>
          ))
        ) : (
          <div className="px-4 py-6 text-sm text-muted-foreground">No hardware configuration was returned by Proxmox.</div>
        )}
      </div>
      <div className="border-t border-border/60 px-4 py-3">
        <h4 className="text-sm font-medium">ISO Media</h4>
        <div className="mt-3 space-y-2">
          {isoImages.length > 0 ? (
            <div className="rounded-xl border border-border/60 bg-background/30 p-3">
              <div className="text-sm font-medium">Attach ISO</div>
              <div className="mt-2 grid gap-2 md:grid-cols-[160px_minmax(0,1fr)]">
                <Select
                  defaultValue={vmHardware?.raw?.ide2 ? "ide2" : "ide2"}
                  onValueChange={() => undefined}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ide2">ide2</SelectItem>
                    <SelectItem value="sata2">sata2</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  onValueChange={(volid) => onHardwareAction({
                    title: "Attach ISO",
                    device: "ide2",
                    value: `${volid},media=cdrom`,
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select ISO image" />
                  </SelectTrigger>
                  <SelectContent>
                    {isoImages.map((iso) => (
                      <SelectItem key={iso.volid} value={iso.volid || ""}>
                        {iso.volid}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function CloneVmDialog({
  state,
  templates,
  busy,
  onClose,
  onSubmit,
  onChange,
}: {
  state: CloneVmState;
  templates: ExplorerItem[];
  busy: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onChange: (state: CloneVmState) => void;
}) {
  return (
    <Dialog open={state.open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Clone VM From Template</DialogTitle>
          <DialogDescription>
            Create a new QEMU guest and apply cloud-init settings through the Proxmox clone endpoint.
          </DialogDescription>
        </DialogHeader>
        <div className="grid max-h-[70vh] gap-4 overflow-y-auto pr-1 md:grid-cols-2">
          <Field label="Template">
            <Select value={state.templateId} onValueChange={(templateId) => onChange({ ...state, templateId })}>
              <SelectTrigger>
                <SelectValue placeholder="Select template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.label} ({template.vmid})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="New VMID">
            <Input value={state.vmid} onChange={(event) => onChange({ ...state, vmid: event.target.value })} inputMode="numeric" placeholder="Auto" />
          </Field>
          <Field label="Name">
            <Input value={state.name} onChange={(event) => onChange({ ...state, name: event.target.value })} />
          </Field>
          <Field label="Target Storage">
            <Input value={state.storage} onChange={(event) => onChange({ ...state, storage: event.target.value })} placeholder="Template default" />
          </Field>
          <Field label="Memory (MiB)">
            <Input value={state.memoryMb} onChange={(event) => onChange({ ...state, memoryMb: event.target.value })} inputMode="numeric" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Sockets">
              <Input value={state.sockets} onChange={(event) => onChange({ ...state, sockets: event.target.value })} inputMode="numeric" />
            </Field>
            <Field label="Cores">
              <Input value={state.cores} onChange={(event) => onChange({ ...state, cores: event.target.value })} inputMode="numeric" />
            </Field>
          </div>
          <Field label="Cloud-init User">
            <Input value={state.ciUser} onChange={(event) => onChange({ ...state, ciUser: event.target.value })} />
          </Field>
          <Field label="Cloud-init Password">
            <Input value={state.ciPassword} onChange={(event) => onChange({ ...state, ciPassword: event.target.value })} type="password" />
          </Field>
          <Field label="IP Config">
            <Input value={state.ipconfig0} onChange={(event) => onChange({ ...state, ipconfig0: event.target.value })} placeholder="ip=dhcp" />
          </Field>
          <Field label="DNS">
            <Input value={state.nameserver} onChange={(event) => onChange({ ...state, nameserver: event.target.value })} placeholder="1.1.1.1" />
          </Field>
          <Field label="Search Domain">
            <Input value={state.searchDomain} onChange={(event) => onChange({ ...state, searchDomain: event.target.value })} />
          </Field>
          <Field label="Snippets Storage">
            <Input value={state.ciSnippetsStorage} onChange={(event) => onChange({ ...state, ciSnippetsStorage: event.target.value })} placeholder="local" />
          </Field>
          <div className="md:col-span-2">
            <Field label="SSH Public Keys">
              <Textarea value={state.sshPublicKeys} onChange={(event) => onChange({ ...state, sshPublicKeys: event.target.value })} placeholder="One key per line" />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Cloud-init Custom Script">
              <Textarea value={state.ciCustomScript} onChange={(event) => onChange({ ...state, ciCustomScript: event.target.value })} />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Description">
              <Textarea value={state.description} onChange={(event) => onChange({ ...state, description: event.target.value })} />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={state.fullClone} onCheckedChange={(checked) => onChange({ ...state, fullClone: checked === true })} />
            Full clone
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={state.start} onCheckedChange={(checked) => onChange({ ...state, start: checked === true })} />
            Start after clone
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={busy || templates.length === 0}>
            {busy ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <CopyPlus className="mr-2 h-4 w-4" />}
            Clone VM
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function HardwareActionDialog({
  state,
  busy,
  nodeOptions,
  bridgeOptions,
  onClose,
  onSubmit,
  onChange,
}: {
  state: HardwareActionState;
  busy: boolean;
  nodeOptions: ProxmoxNodeOptionsResult | null;
  bridgeOptions: string[];
  onClose: () => void;
  onSubmit: () => void;
  onChange: (state: HardwareActionState) => void;
}) {
  const valueOptions = hardwareValueOptions(state, nodeOptions, bridgeOptions);
  const isRemoving = Boolean(state.delete.trim());
  return (
    <Dialog open={state.open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{state.title || "Apply Hardware Change"}</DialogTitle>
          <DialogDescription>
            Choose from Proxmox-compatible presets, then adjust the generated config value when needed.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-4">
            <Field label="Device Key">
              <Input
                value={isRemoving ? state.delete : state.device}
                onChange={(event) => onChange({ ...state, device: event.target.value, delete: "" })}
                placeholder="scsi1"
                disabled={isRemoving || Boolean(state.device)}
              />
            </Field>
          </div>
          {!isRemoving ? (
            <Field label={hardwareFieldName(state.device)}>
              <Select
                value={valueOptions.find((option) => option.value === state.value) ? state.value : undefined}
                onValueChange={(value) => onChange({ ...state, value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={valueOptions.length ? "Select a valid preset" : "No presets for this key"} />
                </SelectTrigger>
                <SelectContent>
                  {valueOptions.map((option) => (
                    <SelectItem key={`${option.label}-${option.value}`} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          ) : null}
          <Field label={isRemoving ? "Action" : "Config Value"}>
            <Textarea
              value={state.value}
              onChange={(event) => onChange({ ...state, value: event.target.value })}
              placeholder="local-lvm:32,discard=on,ssd=1"
              disabled={isRemoving}
            />
          </Field>
          {isRemoving ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              This will remove the selected Proxmox config key from the VM.
            </div>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={busy || (!state.delete.trim() && (!state.device.trim() || !state.value.trim()))}>
            {busy ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Settings className="mr-2 h-4 w-4" />}
            Apply
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

function BridgeSelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  const normalizedOptions = React.useMemo(() => {
    const next = new Set(options.length ? options : ["vmbr0"]);
    if (value) next.add(value);
    return [...next].sort();
  }, [options, value]);

  return (
    <Select value={value || normalizedOptions[0]} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select bridge" />
      </SelectTrigger>
      <SelectContent>
        {normalizedOptions.map((bridge) => (
          <SelectItem key={bridge} value={bridge}>
            {bridge}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
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
