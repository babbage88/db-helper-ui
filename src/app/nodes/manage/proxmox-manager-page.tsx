"use client";

import * as React from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Boxes,
  KeyRound,
  PlayCircle,
  RefreshCw,
  Server,
  Shield,
  TerminalSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { HostServersService } from "@/lib/api/services/HostServersService";
import { ProxmoxService } from "@/lib/api/services/ProxmoxService";
import { hostStatsApi } from "@/lib/host-stats-api";
import { cn } from "@/lib/utils";
import { showErrorToast, showSuccessToast } from "@/lib/toast-utils";
import type { Node } from "./columns";
import type { ProxmoxContainer } from "@/lib/api/models/ProxmoxContainer";
import type { ProxmoxVM } from "@/lib/api/models/ProxmoxVM";
import type { ProxmoxWorkload } from "@/lib/api/models/ProxmoxWorkload";

type AsyncSection =
  | "inventory"
  | "vm"
  | "lxc"
  | "template"
  | "start"
  | "pve-user"
  | "api-token";

type InventoryErrors = {
  workloads?: string;
  vms?: string;
  containers?: string;
};

const defaultVmForm = {
  vmid: "",
  template_vmid: "",
  name: "",
  storage: "",
  cores: "2",
  sockets: "1",
  memory_mb: "2048",
  ci_user: "",
  ci_password: "",
  ipconfig0: "",
  nameserver: "",
  search_domain: "",
  ssh_public_keys: "",
  description: "",
  full_clone: true,
  start: true,
  ci_custom_script: "",
  ci_snippets_storage: "",
};

const defaultLxcForm = {
  vmid: "",
  hostname: "",
  ostemplate: "",
  storage: "",
  rootfs_size: "8G",
  memory: "1024",
  swap: "512",
  cores: "2",
  password: "",
  net0: "",
  nameserver: "",
  search_domain: "",
  ssh_public_keys: "",
  description: "",
  features: "",
  arch: "amd64",
  cmode: "shell",
  console: true,
  start: true,
  unprivileged: true,
  cpu_limit: "",
  cpu_units: "",
};

const defaultTemplateForm = {
  vmid: "",
  name: "",
  image_url: "",
  storage: "",
  cores: "2",
  sockets: "1",
  memory_mb: "2048",
  net0: "virtio,bridge=vmbr0",
  description: "",
  agent: true,
  cleanup_image: true,
  serial_console: true,
  boot_order: "c",
  cloudinit_storage: "",
  disk_bus: "scsi0",
  scsihw: "virtio-scsi-pci",
};

const defaultVmStartForm = { vmid: "" };

const defaultPveUserForm = {
  username: "",
  realm: "pve",
  comment: "",
  password: "",
  force: false,
};

const defaultApiTokenForm = {
  username: "root",
  realm: "pam",
  userid: "",
  token_id: "infractl-ui",
  comment: "Created from InfraCTL UI",
  role: "InfraCtlProxmoxManager",
  acl_path: "/",
  expiration_date: "",
  days_valid: "30",
  privsep: true,
  force: false,
  verify: true,
  store_as_user_secret: true,
  yolo: false,
};

const actionTabs = [
  {
    value: "vm",
    label: "VM",
    description: "Clone a VM from a template with cloud-init configuration.",
    icon: Server,
  },
  {
    value: "lxc",
    label: "LXC",
    description: "Provision a container with compute, storage, and network settings.",
    icon: Boxes,
  },
  {
    value: "template",
    label: "Template",
    description: "Build a reusable VM template from an image URL.",
    icon: TerminalSquare,
  },
  {
    value: "start",
    label: "Start",
    description: "Power on an existing VM by VMID.",
    icon: PlayCircle,
  },
  {
    value: "pve-user",
    label: "PVE User",
    description: "Create or recreate a Proxmox VE user.",
    icon: Shield,
  },
  {
    value: "api-token",
    label: "API Token",
    description: "Issue a scoped token for automation and secret storage.",
    icon: KeyRound,
  },
] as const;

function parseInteger(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function toErrorMessage(error: unknown) {
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

export default function ProxmoxManagerPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { nodeId } = useParams<{ nodeId: string }>();
  const seededNode = (location.state as { node?: Node } | null)?.node ?? null;

  const [node, setNode] = React.useState<Node | null>(seededNode);
  const [isLoadingNode, setIsLoadingNode] = React.useState(!seededNode);
  const [nodeError, setNodeError] = React.useState<string | null>(null);

  const [isLoadingInventory, setIsLoadingInventory] = React.useState(false);
  const [busySection, setBusySection] = React.useState<AsyncSection | null>(null);
  const [inventoryErrors, setInventoryErrors] = React.useState<InventoryErrors>({});
  const [workloads, setWorkloads] = React.useState<ProxmoxWorkload[]>([]);
  const [vms, setVms] = React.useState<ProxmoxVM[]>([]);
  const [containers, setContainers] = React.useState<ProxmoxContainer[]>([]);
  const [apiResult, setApiResult] = React.useState<unknown>(null);
  const [hostStatsSummary, setHostStatsSummary] = React.useState<{
    cpuCores?: number;
    memoryTotalBytes?: number;
    storageTotalBytes?: number;
    status?: string;
    error?: string;
  } | null>(null);

  const [vmForm, setVmForm] = React.useState(defaultVmForm);
  const [lxcForm, setLxcForm] = React.useState(defaultLxcForm);
  const [templateForm, setTemplateForm] = React.useState(defaultTemplateForm);
  const [vmStartForm, setVmStartForm] = React.useState(defaultVmStartForm);
  const [pveUserForm, setPveUserForm] = React.useState(defaultPveUserForm);
  const [apiTokenForm, setApiTokenForm] = React.useState(defaultApiTokenForm);

  const hostServerId = node?.ID ?? nodeId ?? "";
  const hostLabel = node?.Hostname || node?.IpAddress || "Proxmox host";
  const hostTypeSummary =
    node?.hostServerTypeNames?.length ? node.hostServerTypeNames.join(", ") : "Unclassified host";

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
        setHostStatsSummary(
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
        setNodeError(toErrorMessage(error));
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
      nextErrors.workloads = toErrorMessage(workloadsResult.reason);
    }

    const vmsResult = results[1];
    if (vmsResult.status === "fulfilled") {
      setVms(vmsResult.value.vms || []);
    } else {
      setVms([]);
      nextErrors.vms = toErrorMessage(vmsResult.reason);
    }

    const containersResult = results[2];
    if (containersResult.status === "fulfilled") {
      setContainers(containersResult.value.containers || []);
    } else {
      setContainers([]);
      nextErrors.containers = toErrorMessage(containersResult.reason);
    }

    const statsResult = results[3];
    if (statsResult.status === "fulfilled" && statsResult.value) {
      setHostStatsSummary({
        cpuCores: statsResult.value.cpuCores,
        memoryTotalBytes: statsResult.value.memoryTotalBytes,
        storageTotalBytes: statsResult.value.storageTotalBytes,
        status: statsResult.value.status,
        error: statsResult.value.error,
      });
    }

    setInventoryErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      showErrorToast(
        "Some Proxmox inventory endpoints failed",
        "The page is staying up and showing the sections that still returned data."
      );
    }
    setIsLoadingInventory(false);
  }, [hostServerId]);

  React.useEffect(() => {
    if (!hostServerId) return;
    refreshInventory();
  }, [hostServerId, refreshInventory]);

  const runSection = React.useCallback(
    async (section: AsyncSection, task: () => Promise<unknown>, successMessage: string) => {
      setBusySection(section);
      try {
        const result = await task();
        setApiResult(result);
        showSuccessToast(successMessage, "Response payload is shown below.");
        if (section === "vm" || section === "lxc" || section === "template" || section === "start") {
          refreshInventory();
        }
      } catch (error: unknown) {
        const message = toErrorMessage(error);
        setApiResult({ error: message });
        showErrorToast(successMessage, message);
      } finally {
        setBusySection(null);
      }
    },
    [refreshInventory]
  );

  if (isLoadingNode) {
    return <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">Loading Proxmox workspace...</div>;
  }

  if (!node || nodeError) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 py-10">
        <Button variant="outline" onClick={() => navigate("/nodes/manage")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Managed Nodes
        </Button>
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle>Unable to load Proxmox workspace</CardTitle>
            <CardDescription>{nodeError || "The requested node could not be loaded."}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const hasInventoryErrors = Object.keys(inventoryErrors).length > 0;

  return (
    <div className="mx-auto flex w-full max-w-[1700px] flex-col gap-6 px-2 py-4 sm:px-4 sm:py-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-3">
          <Button variant="ghost" className="w-fit px-0 text-muted-foreground" onClick={() => navigate("/nodes/manage")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Managed Nodes
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
              Proxmox Workspace
            </Badge>
            <Badge variant="outline">{hostTypeSummary}</Badge>
            {node.platformTypeNames.map((name) => (
              <Badge key={name} variant="secondary">{name}</Badge>
            ))}
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{hostLabel}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Dedicated operations page for inventory, provisioning, lifecycle actions, and access management.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:min-w-[520px]">
          <SummaryPill label="Workloads" value={String(workloads.length)} />
          <SummaryPill label="VMs" value={String(vms.length)} />
          <SummaryPill label="LXCs" value={String(containers.length)} />
          <SummaryPill
            label="Inventory"
            value={hasInventoryErrors ? "Partial" : isLoadingInventory ? "Syncing" : "Ready"}
            tone={hasInventoryErrors ? "warning" : isLoadingInventory ? "warning" : "success"}
          />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(620px,1.15fr)_minmax(560px,0.85fr)]">
        <div className="space-y-4">
          <Card className="border-border/70 bg-card/70 shadow-none">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>Live inventory</CardTitle>
                <CardDescription>
                  The workspace now tolerates endpoint failures per section instead of crashing the whole experience.
                </CardDescription>
              </div>
              <Button variant="outline" onClick={refreshInventory} disabled={isLoadingInventory}>
                <RefreshCw className={cn("mr-2 h-4 w-4", isLoadingInventory && "animate-spin")} />
                Refresh
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {hasInventoryErrors && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
                  Some inventory endpoints failed. The sections below show each failure without taking down the rest of the page.
                </div>
              )}
              <div className="grid gap-3 md:grid-cols-4">
                <SummaryCard label="IP Address" value={node.IpAddress || "-"} mono />
                <SummaryCard label="Username" value={node.Username || "-"} mono />
                <SummaryCard label="CPU Cores" value={hostStatsSummary?.cpuCores ? String(hostStatsSummary.cpuCores) : "-"} />
                <SummaryCard label="Agent Status" value={hostStatsSummary?.status || "-"} />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <MetricCard label="Memory" value={formatBytesSafe(hostStatsSummary?.memoryTotalBytes)} />
                <MetricCard label="Storage" value={formatBytesSafe(hostStatsSummary?.storageTotalBytes)} />
                <MetricCard label="Last Modified" value={node.LastModified ? new Date(node.LastModified).toLocaleDateString() : "-"} />
              </div>
            </CardContent>
          </Card>

          <WorkloadTable
            title="All workloads"
            description="Combined VM and container inventory for quick verification."
            items={workloads}
            kindLabel
            error={inventoryErrors.workloads}
          />
          <WorkloadTable
            title="Virtual machines"
            description="VM records reported by the Proxmox VM inventory endpoint."
            items={vms}
            error={inventoryErrors.vms}
          />
          <WorkloadTable
            title="Containers"
            description="LXC records reported by the Proxmox container inventory endpoint."
            items={containers}
            error={inventoryErrors.containers}
          />
        </div>

        <div className="space-y-4">
          <Tabs defaultValue="vm" className="gap-4">
            <TabsList className="grid h-auto w-full grid-cols-2 gap-2 rounded-xl bg-muted/60 p-2 xl:grid-cols-3">
              {actionTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="h-auto min-h-16 flex-col items-start gap-1 rounded-lg px-3 py-3 text-left"
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </span>
                    <span className="whitespace-normal text-xs leading-5 text-muted-foreground">
                      {tab.description}
                    </span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <TabsContent value="vm">
              <ActionCard title="Create VM" description="Clone a new VM from a template and apply guest identity, storage, and cloud-init settings.">
                <SectionBlock title="Identity" description="Core identifiers for the clone target and template source.">
                  <ResponsiveFieldGrid>
                    <TextInput label="VM ID" value={vmForm.vmid} onChange={(value) => setVmForm((prev) => ({ ...prev, vmid: value }))} />
                    <TextInput label="Template VMID" value={vmForm.template_vmid} onChange={(value) => setVmForm((prev) => ({ ...prev, template_vmid: value }))} />
                    <TextInput label="Name" value={vmForm.name} onChange={(value) => setVmForm((prev) => ({ ...prev, name: value }))} className="sm:col-span-2" />
                    <TextInput label="Storage" value={vmForm.storage} onChange={(value) => setVmForm((prev) => ({ ...prev, storage: value }))} className="sm:col-span-2" />
                  </ResponsiveFieldGrid>
                </SectionBlock>
                <SectionBlock title="Compute profile" description="Sizing values passed to the Proxmox VM create endpoint.">
                  <InlineNumericFields
                    fields={[
                      { label: "Cores", value: vmForm.cores, onChange: (value) => setVmForm((prev) => ({ ...prev, cores: value })) },
                      { label: "Sockets", value: vmForm.sockets, onChange: (value) => setVmForm((prev) => ({ ...prev, sockets: value })) },
                      { label: "Memory MB", value: vmForm.memory_mb, onChange: (value) => setVmForm((prev) => ({ ...prev, memory_mb: value })) },
                    ]}
                  />
                </SectionBlock>
                <SectionBlock title="Cloud-init" description="Guest bootstrap settings, networking, and SSH access.">
                  <ResponsiveFieldGrid>
                    <TextInput label="Cloud-init User" value={vmForm.ci_user} onChange={(value) => setVmForm((prev) => ({ ...prev, ci_user: value }))} />
                    <TextInput label="Cloud-init Password" value={vmForm.ci_password} onChange={(value) => setVmForm((prev) => ({ ...prev, ci_password: value }))} />
                    <TextInput label="IP Config 0" value={vmForm.ipconfig0} onChange={(value) => setVmForm((prev) => ({ ...prev, ipconfig0: value }))} className="sm:col-span-2" />
                    <TextInput label="Nameserver" value={vmForm.nameserver} onChange={(value) => setVmForm((prev) => ({ ...prev, nameserver: value }))} />
                    <TextInput label="Search Domain" value={vmForm.search_domain} onChange={(value) => setVmForm((prev) => ({ ...prev, search_domain: value }))} />
                    <TextInput label="CI Custom Script" value={vmForm.ci_custom_script} onChange={(value) => setVmForm((prev) => ({ ...prev, ci_custom_script: value }))} className="sm:col-span-2" />
                    <TextInput label="CI Snippets Storage" value={vmForm.ci_snippets_storage} onChange={(value) => setVmForm((prev) => ({ ...prev, ci_snippets_storage: value }))} className="sm:col-span-2" />
                  </ResponsiveFieldGrid>
                  <TextareaField label="SSH Public Keys" value={vmForm.ssh_public_keys} onChange={(value) => setVmForm((prev) => ({ ...prev, ssh_public_keys: value }))} placeholder="One public key per line" />
                </SectionBlock>
                <SectionBlock title="Behavior" description="Optional metadata and post-create actions.">
                  <TextareaField label="Description" value={vmForm.description} onChange={(value) => setVmForm((prev) => ({ ...prev, description: value }))} />
                  <CheckRow
                    items={[
                      { label: "Full clone", checked: vmForm.full_clone, onChange: (checked) => setVmForm((prev) => ({ ...prev, full_clone: checked })) },
                      { label: "Start after create", checked: vmForm.start, onChange: (checked) => setVmForm((prev) => ({ ...prev, start: checked })) },
                    ]}
                  />
                </SectionBlock>
                <PrimaryActionButton
                  busy={busySection === "vm"}
                  idleLabel="Create VM"
                  onClick={() =>
                    runSection(
                      "vm",
                      () =>
                        ProxmoxService.createProxmoxVm({
                          host_server_id: hostServerId,
                          vmid: parseInteger(vmForm.vmid),
                          template_vmid: parseInteger(vmForm.template_vmid),
                          name: vmForm.name.trim() || undefined,
                          storage: vmForm.storage.trim() || undefined,
                          cores: parseInteger(vmForm.cores),
                          sockets: parseInteger(vmForm.sockets),
                          memory_mb: parseInteger(vmForm.memory_mb),
                          ci_user: vmForm.ci_user.trim() || undefined,
                          ci_password: vmForm.ci_password.trim() || undefined,
                          ipconfig0: vmForm.ipconfig0.trim() || undefined,
                          nameserver: vmForm.nameserver.trim() || undefined,
                          search_domain: vmForm.search_domain.trim() || undefined,
                          ssh_public_keys: parseLines(vmForm.ssh_public_keys),
                          description: vmForm.description.trim() || undefined,
                          start: vmForm.start,
                          full_clone: vmForm.full_clone,
                          ci_custom_script: vmForm.ci_custom_script.trim() || undefined,
                          ci_snippets_storage: vmForm.ci_snippets_storage.trim() || undefined,
                        }),
                      "VM create request finished"
                    )
                  }
                />
              </ActionCard>
            </TabsContent>

            <TabsContent value="lxc">
              <ActionCard title="Create LXC" description="Provision a container with host identity, storage, network, and resource controls.">
                <SectionBlock title="Identity" description="Container name, template image, and storage destination.">
                  <ResponsiveFieldGrid>
                    <TextInput label="VMID" value={lxcForm.vmid} onChange={(value) => setLxcForm((prev) => ({ ...prev, vmid: value }))} />
                    <TextInput label="Hostname" value={lxcForm.hostname} onChange={(value) => setLxcForm((prev) => ({ ...prev, hostname: value }))} />
                    <TextInput label="OS Template" value={lxcForm.ostemplate} onChange={(value) => setLxcForm((prev) => ({ ...prev, ostemplate: value }))} className="sm:col-span-2" />
                    <TextInput label="Storage" value={lxcForm.storage} onChange={(value) => setLxcForm((prev) => ({ ...prev, storage: value }))} />
                    <TextInput label="RootFS Size" value={lxcForm.rootfs_size} onChange={(value) => setLxcForm((prev) => ({ ...prev, rootfs_size: value }))} />
                  </ResponsiveFieldGrid>
                </SectionBlock>
                <SectionBlock title="Resources" description="Container memory, swap, CPU, and scheduling controls.">
                  <InlineNumericFields
                    fields={[
                      { label: "Memory", value: lxcForm.memory, onChange: (value) => setLxcForm((prev) => ({ ...prev, memory: value })) },
                      { label: "Swap", value: lxcForm.swap, onChange: (value) => setLxcForm((prev) => ({ ...prev, swap: value })) },
                      { label: "Cores", value: lxcForm.cores, onChange: (value) => setLxcForm((prev) => ({ ...prev, cores: value })) },
                    ]}
                  />
                  <InlineNumericFields
                    fields={[
                      { label: "CPU Limit", value: lxcForm.cpu_limit, onChange: (value) => setLxcForm((prev) => ({ ...prev, cpu_limit: value })) },
                      { label: "CPU Units", value: lxcForm.cpu_units, onChange: (value) => setLxcForm((prev) => ({ ...prev, cpu_units: value })) },
                    ]}
                  />
                </SectionBlock>
                <SectionBlock title="Access and networking" description="Guest credentials, network configuration, SSH keys, and runtime features.">
                  <ResponsiveFieldGrid>
                    <TextInput label="Password" value={lxcForm.password} onChange={(value) => setLxcForm((prev) => ({ ...prev, password: value }))} />
                    <TextInput label="Architecture" value={lxcForm.arch} onChange={(value) => setLxcForm((prev) => ({ ...prev, arch: value }))} />
                    <TextInput label="Network net0" value={lxcForm.net0} onChange={(value) => setLxcForm((prev) => ({ ...prev, net0: value }))} className="sm:col-span-2" />
                    <TextInput label="Nameserver" value={lxcForm.nameserver} onChange={(value) => setLxcForm((prev) => ({ ...prev, nameserver: value }))} />
                    <TextInput label="Search Domain" value={lxcForm.search_domain} onChange={(value) => setLxcForm((prev) => ({ ...prev, search_domain: value }))} />
                    <TextInput label="Features" value={lxcForm.features} onChange={(value) => setLxcForm((prev) => ({ ...prev, features: value }))} className="sm:col-span-2" />
                    <TextInput label="Console Mode" value={lxcForm.cmode} onChange={(value) => setLxcForm((prev) => ({ ...prev, cmode: value }))} />
                  </ResponsiveFieldGrid>
                  <TextareaField label="SSH Public Keys" value={lxcForm.ssh_public_keys} onChange={(value) => setLxcForm((prev) => ({ ...prev, ssh_public_keys: value }))} placeholder="One public key per line" />
                  <TextareaField label="Description" value={lxcForm.description} onChange={(value) => setLxcForm((prev) => ({ ...prev, description: value }))} />
                  <CheckRow
                    items={[
                      { label: "Console enabled", checked: lxcForm.console, onChange: (checked) => setLxcForm((prev) => ({ ...prev, console: checked })) },
                      { label: "Start after create", checked: lxcForm.start, onChange: (checked) => setLxcForm((prev) => ({ ...prev, start: checked })) },
                      { label: "Unprivileged", checked: lxcForm.unprivileged, onChange: (checked) => setLxcForm((prev) => ({ ...prev, unprivileged: checked })) },
                    ]}
                  />
                </SectionBlock>
                <PrimaryActionButton
                  busy={busySection === "lxc"}
                  idleLabel="Create LXC"
                  onClick={() =>
                    runSection(
                      "lxc",
                      () =>
                        ProxmoxService.createProxmoxLxc({
                          host_server_id: hostServerId,
                          vmid: parseInteger(lxcForm.vmid),
                          hostname: lxcForm.hostname.trim() || undefined,
                          ostemplate: lxcForm.ostemplate.trim() || undefined,
                          storage: lxcForm.storage.trim() || undefined,
                          rootfs_size: lxcForm.rootfs_size.trim() || undefined,
                          memory: parseInteger(lxcForm.memory),
                          swap: parseInteger(lxcForm.swap),
                          cores: parseInteger(lxcForm.cores),
                          password: lxcForm.password.trim() || undefined,
                          net0: lxcForm.net0.trim() || undefined,
                          nameserver: lxcForm.nameserver.trim() || undefined,
                          search_domain: lxcForm.search_domain.trim() || undefined,
                          ssh_public_keys: parseLines(lxcForm.ssh_public_keys),
                          description: lxcForm.description.trim() || undefined,
                          features: lxcForm.features.trim() || undefined,
                          arch: lxcForm.arch.trim() || undefined,
                          cmode: lxcForm.cmode.trim() || undefined,
                          console: lxcForm.console,
                          start: lxcForm.start,
                          unprivileged: lxcForm.unprivileged,
                          cpu_limit: parseInteger(lxcForm.cpu_limit),
                          cpu_units: parseInteger(lxcForm.cpu_units),
                        }),
                      "LXC create request finished"
                    )
                  }
                />
              </ActionCard>
            </TabsContent>

            <TabsContent value="template">
              <ActionCard title="Create VM Template" description="Define a reusable VM template from a source image and baseline hardware profile.">
                <SectionBlock title="Source and identity" description="Template identifiers and the image source used to build it.">
                  <ResponsiveFieldGrid>
                    <TextInput label="VMID" value={templateForm.vmid} onChange={(value) => setTemplateForm((prev) => ({ ...prev, vmid: value }))} />
                    <TextInput label="Name" value={templateForm.name} onChange={(value) => setTemplateForm((prev) => ({ ...prev, name: value }))} />
                    <TextInput label="Image URL" value={templateForm.image_url} onChange={(value) => setTemplateForm((prev) => ({ ...prev, image_url: value }))} className="sm:col-span-2" />
                    <TextInput label="Storage" value={templateForm.storage} onChange={(value) => setTemplateForm((prev) => ({ ...prev, storage: value }))} className="sm:col-span-2" />
                  </ResponsiveFieldGrid>
                </SectionBlock>
                <SectionBlock title="Hardware profile" description="Compute, networking, boot, and storage bus settings.">
                  <InlineNumericFields
                    fields={[
                      { label: "Cores", value: templateForm.cores, onChange: (value) => setTemplateForm((prev) => ({ ...prev, cores: value })) },
                      { label: "Sockets", value: templateForm.sockets, onChange: (value) => setTemplateForm((prev) => ({ ...prev, sockets: value })) },
                      { label: "Memory MB", value: templateForm.memory_mb, onChange: (value) => setTemplateForm((prev) => ({ ...prev, memory_mb: value })) },
                    ]}
                  />
                  <ResponsiveFieldGrid>
                    <TextInput label="net0" value={templateForm.net0} onChange={(value) => setTemplateForm((prev) => ({ ...prev, net0: value }))} className="sm:col-span-2" />
                    <TextInput label="Boot Order" value={templateForm.boot_order} onChange={(value) => setTemplateForm((prev) => ({ ...prev, boot_order: value }))} />
                    <TextInput label="Cloud-init Storage" value={templateForm.cloudinit_storage} onChange={(value) => setTemplateForm((prev) => ({ ...prev, cloudinit_storage: value }))} />
                    <TextInput label="Disk Bus" value={templateForm.disk_bus} onChange={(value) => setTemplateForm((prev) => ({ ...prev, disk_bus: value }))} />
                    <TextInput label="SCSI HW" value={templateForm.scsihw} onChange={(value) => setTemplateForm((prev) => ({ ...prev, scsihw: value }))} />
                  </ResponsiveFieldGrid>
                </SectionBlock>
                <SectionBlock title="Behavior" description="Template metadata and automation defaults.">
                  <TextareaField label="Description" value={templateForm.description} onChange={(value) => setTemplateForm((prev) => ({ ...prev, description: value }))} />
                  <CheckRow
                    items={[
                      { label: "QEMU agent", checked: templateForm.agent, onChange: (checked) => setTemplateForm((prev) => ({ ...prev, agent: checked })) },
                      { label: "Cleanup image", checked: templateForm.cleanup_image, onChange: (checked) => setTemplateForm((prev) => ({ ...prev, cleanup_image: checked })) },
                      { label: "Serial console", checked: templateForm.serial_console, onChange: (checked) => setTemplateForm((prev) => ({ ...prev, serial_console: checked })) },
                    ]}
                  />
                </SectionBlock>
                <PrimaryActionButton
                  busy={busySection === "template"}
                  idleLabel="Create VM Template"
                  onClick={() =>
                    runSection(
                      "template",
                      () =>
                        ProxmoxService.createProxmoxVmTemplate({
                          host_server_id: hostServerId,
                          vmid: parseInteger(templateForm.vmid),
                          name: templateForm.name.trim() || undefined,
                          image_url: templateForm.image_url.trim() || undefined,
                          storage: templateForm.storage.trim() || undefined,
                          cores: parseInteger(templateForm.cores),
                          sockets: parseInteger(templateForm.sockets),
                          memory_mb: parseInteger(templateForm.memory_mb),
                          net0: templateForm.net0.trim() || undefined,
                          description: templateForm.description.trim() || undefined,
                          agent: templateForm.agent,
                          cleanup_image: templateForm.cleanup_image,
                          serial_console: templateForm.serial_console,
                          boot_order: templateForm.boot_order.trim() || undefined,
                          cloudinit_storage: templateForm.cloudinit_storage.trim() || undefined,
                          disk_bus: templateForm.disk_bus.trim() || undefined,
                          scsihw: templateForm.scsihw.trim() || undefined,
                        }),
                      "VM template request finished"
                    )
                  }
                />
              </ActionCard>
            </TabsContent>

            <TabsContent value="start">
              <ActionCard title="Start VM" description="Start an existing VM on this host using its VMID.">
                <SectionBlock title="Power action" description="Use this for a direct VM start without opening the full VM workflow.">
                  <ResponsiveFieldGrid>
                    <TextInput label="VMID" value={vmStartForm.vmid} onChange={(value) => setVmStartForm({ vmid: value })} />
                  </ResponsiveFieldGrid>
                </SectionBlock>
                <PrimaryActionButton
                  busy={busySection === "start"}
                  idleLabel="Start VM"
                  disabled={!parseInteger(vmStartForm.vmid)}
                  onClick={() =>
                    runSection(
                      "start",
                      () =>
                        ProxmoxService.startProxmoxVm(parseInteger(vmStartForm.vmid)!, {
                          host_server_id: hostServerId,
                          vmid: parseInteger(vmStartForm.vmid),
                        }),
                      "VM start request finished"
                    )
                  }
                />
              </ActionCard>
            </TabsContent>

            <TabsContent value="pve-user">
              <ActionCard title="Create PVE User" description="Create a Proxmox VE user record and optionally force recreation if it already exists.">
                <SectionBlock title="Account settings" description="User identity, realm, credentials, and optional notes.">
                  <ResponsiveFieldGrid>
                    <TextInput label="Username" value={pveUserForm.username} onChange={(value) => setPveUserForm((prev) => ({ ...prev, username: value }))} />
                    <TextInput label="Realm" value={pveUserForm.realm} onChange={(value) => setPveUserForm((prev) => ({ ...prev, realm: value }))} />
                    <TextInput label="Password" value={pveUserForm.password} onChange={(value) => setPveUserForm((prev) => ({ ...prev, password: value }))} className="sm:col-span-2" />
                  </ResponsiveFieldGrid>
                  <TextareaField label="Comment" value={pveUserForm.comment} onChange={(value) => setPveUserForm((prev) => ({ ...prev, comment: value }))} />
                  <CheckRow
                    items={[
                      { label: "Force recreate", checked: pveUserForm.force, onChange: (checked) => setPveUserForm((prev) => ({ ...prev, force: checked })) },
                    ]}
                  />
                </SectionBlock>
                <PrimaryActionButton
                  busy={busySection === "pve-user"}
                  idleLabel="Create PVE User"
                  onClick={() =>
                    runSection(
                      "pve-user",
                      () =>
                        ProxmoxService.createProxmoxPveUser({
                          host_server_id: hostServerId,
                          username: pveUserForm.username.trim() || undefined,
                          realm: pveUserForm.realm.trim() || undefined,
                          password: pveUserForm.password.trim() || undefined,
                          comment: pveUserForm.comment.trim() || undefined,
                          force: pveUserForm.force,
                        }),
                      "PVE user request finished"
                    )
                  }
                />
              </ActionCard>
            </TabsContent>

            <TabsContent value="api-token">
              <ActionCard title="Create API Token" description="Generate an automation token with role and ACL settings, then optionally store it as a user secret.">
                <SectionBlock title="Principal" description="Target user information and token identity.">
                  <ResponsiveFieldGrid>
                    <TextInput label="Username" value={apiTokenForm.username} onChange={(value) => setApiTokenForm((prev) => ({ ...prev, username: value }))} />
                    <TextInput label="Realm" value={apiTokenForm.realm} onChange={(value) => setApiTokenForm((prev) => ({ ...prev, realm: value }))} />
                    <TextInput label="User ID" value={apiTokenForm.userid} onChange={(value) => setApiTokenForm((prev) => ({ ...prev, userid: value }))} />
                    <TextInput label="Token ID" value={apiTokenForm.token_id} onChange={(value) => setApiTokenForm((prev) => ({ ...prev, token_id: value }))} />
                  </ResponsiveFieldGrid>
                </SectionBlock>
                <SectionBlock title="Authorization" description="Role assignment, ACL scope, and expiration settings.">
                  <ResponsiveFieldGrid>
                    <TextInput label="Role" value={apiTokenForm.role} onChange={(value) => setApiTokenForm((prev) => ({ ...prev, role: value }))} />
                    <TextInput label="ACL Path" value={apiTokenForm.acl_path} onChange={(value) => setApiTokenForm((prev) => ({ ...prev, acl_path: value }))} />
                    <TextInput label="Expiration Date" value={apiTokenForm.expiration_date} onChange={(value) => setApiTokenForm((prev) => ({ ...prev, expiration_date: value }))} placeholder="YYYY-MM-DD or RFC3339" />
                    <TextInput label="Days Valid" value={apiTokenForm.days_valid} onChange={(value) => setApiTokenForm((prev) => ({ ...prev, days_valid: value }))} />
                  </ResponsiveFieldGrid>
                </SectionBlock>
                <SectionBlock title="Behavior" description="Comments plus safety and convenience switches.">
                  <TextareaField label="Comment" value={apiTokenForm.comment} onChange={(value) => setApiTokenForm((prev) => ({ ...prev, comment: value }))} />
                  <CheckRow
                    items={[
                      { label: "Privsep", checked: apiTokenForm.privsep, onChange: (checked) => setApiTokenForm((prev) => ({ ...prev, privsep: checked })) },
                      { label: "Force recreate", checked: apiTokenForm.force, onChange: (checked) => setApiTokenForm((prev) => ({ ...prev, force: checked })) },
                      { label: "Verify", checked: apiTokenForm.verify, onChange: (checked) => setApiTokenForm((prev) => ({ ...prev, verify: checked })) },
                      { label: "Store as user secret", checked: apiTokenForm.store_as_user_secret, onChange: (checked) => setApiTokenForm((prev) => ({ ...prev, store_as_user_secret: checked })) },
                      { label: "YOLO", checked: apiTokenForm.yolo, onChange: (checked) => setApiTokenForm((prev) => ({ ...prev, yolo: checked })) },
                    ]}
                  />
                </SectionBlock>
                <PrimaryActionButton
                  busy={busySection === "api-token"}
                  idleLabel="Create API Token"
                  onClick={() =>
                    runSection(
                      "api-token",
                      () =>
                        ProxmoxService.createProxmoxApiToken({
                          host_server_id: hostServerId,
                          username: apiTokenForm.yolo ? undefined : apiTokenForm.username.trim() || undefined,
                          realm: apiTokenForm.yolo ? undefined : apiTokenForm.realm.trim() || undefined,
                          userid: apiTokenForm.userid.trim() || undefined,
                          token_id: apiTokenForm.token_id.trim() || undefined,
                          role: apiTokenForm.yolo ? undefined : apiTokenForm.role.trim() || undefined,
                          acl_path: apiTokenForm.yolo ? undefined : apiTokenForm.acl_path.trim() || undefined,
                          expiration_date: apiTokenForm.expiration_date.trim() || undefined,
                          days_valid: parseInteger(apiTokenForm.days_valid),
                          comment: apiTokenForm.comment.trim() || undefined,
                          privsep: apiTokenForm.privsep,
                          force: apiTokenForm.force,
                          verify: apiTokenForm.verify,
                          store_as_user_secret: apiTokenForm.store_as_user_secret,
                          yolo: apiTokenForm.yolo,
                        }),
                      "API token request finished"
                    )
                  }
                />
              </ActionCard>
            </TabsContent>
          </Tabs>

          <Card className="border-border/70 bg-card/70 shadow-none">
            <CardHeader>
              <CardTitle>Last response</CardTitle>
              <CardDescription>Latest payload returned from a Proxmox endpoint call.</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="max-h-[260px] overflow-auto rounded-xl border border-border/70 bg-background/80 p-4 text-xs leading-6">
                {JSON.stringify(apiResult, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ActionCard({
  title,
  description,
  children,
}: React.PropsWithChildren<{ title: string; description: string }>) {
  return (
    <Card className="border-border/70 bg-card/70 shadow-none">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">{children}</CardContent>
    </Card>
  );
}

function SectionBlock({
  title,
  description,
  children,
}: React.PropsWithChildren<{ title: string; description?: string }>) {
  return (
    <section className="space-y-4 rounded-xl border border-border/70 bg-muted/15 p-4">
      <div className="space-y-1">
        <h4 className="text-sm font-semibold tracking-tight">{title}</h4>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

function ResponsiveFieldGrid({ children }: React.PropsWithChildren) {
  return <div className="grid gap-3 sm:grid-cols-2">{children}</div>;
}

function SummaryCard({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-background/70 p-4">
      <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <div className={cn("mt-2 text-lg font-semibold tracking-tight", mono && "font-mono text-sm")}>
        {value}
      </div>
    </div>
  );
}

function SummaryPill({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "success" | "warning" | "danger";
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3 text-left shadow-sm",
        tone === "success" && "border-emerald-500/25 bg-emerald-500/10",
        tone === "warning" && "border-amber-500/25 bg-amber-500/10",
        tone === "danger" && "border-destructive/30 bg-destructive/10",
        tone === "neutral" && "border-border/70 bg-card/70"
      )}
    >
      <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold tracking-tight">{value}</div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-background/40 p-4">
      <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      <div className="mt-2 text-base font-semibold">{value}</div>
    </div>
  );
}

function WorkloadTable({
  title,
  description,
  items,
  kindLabel = false,
  error,
}: {
  title: string;
  description?: string;
  items: Array<ProxmoxWorkload | ProxmoxVM | ProxmoxContainer>;
  kindLabel?: boolean;
  error?: string;
}) {
  return (
    <Card className="border-border/70 bg-card/70 shadow-none">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{title}</CardTitle>
            {description ? <CardDescription>{description}</CardDescription> : null}
          </div>
          <Badge variant="outline" className="rounded-full px-2.5 py-1">
            {items.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}
        <div className="overflow-x-auto rounded-xl border border-border/70">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em]">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em]">VMID</th>
                {kindLabel ? <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em]">Kind</th> : null}
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em]">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em]">Node</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em]">CPU</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em]">Memory</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em]">Disk</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-muted-foreground" colSpan={kindLabel ? 8 : 7}>
                    No items returned.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={`${item.vmid}-${item.name}`} className="border-t border-border/60 bg-background/30">
                    <td className="px-4 py-3 font-medium">{item.name || "-"}</td>
                    <td className="px-4 py-3 font-mono text-xs">{item.vmid ?? "-"}</td>
                    {kindLabel ? <td className="px-4 py-3">{(item as ProxmoxWorkload).kind || "-"}</td> : null}
                    <td className="px-4 py-3">{item.status || "-"}</td>
                    <td className="px-4 py-3">{item.node || "-"}</td>
                    <td className="px-4 py-3 font-mono text-xs">{typeof item.cpu === "number" ? item.cpu.toFixed(2) : "-"}</td>
                    <td className="px-4 py-3">{formatSize(item.mem, item.maxmem)}</td>
                    <td className="px-4 py-3">{formatSize(getDiskUsed(item), item.maxdisk)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function formatSize(used?: number, total?: number) {
  const formatter = (value?: number) => {
    if (value === undefined || value === null) return "-";
    if (value >= 1024 * 1024 * 1024) return `${(value / (1024 * 1024 * 1024)).toFixed(1)} GiB`;
    if (value >= 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MiB`;
    return String(value);
  };

  if (used === undefined && total === undefined) return "-";
  return `${formatter(used)} / ${formatter(total)}`;
}

function formatBytesSafe(value?: number) {
  if (!value) return "-";
  if (value >= 1024 * 1024 * 1024) return `${(value / (1024 * 1024 * 1024)).toFixed(1)} GiB`;
  if (value >= 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MiB`;
  return String(value);
}

function getDiskUsed(item: ProxmoxWorkload | ProxmoxVM | ProxmoxContainer) {
  if ("disk" in item && typeof item.disk === "number") {
    return item.disk;
  }
  return undefined;
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{label}</Label>
      <Input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="border-border/70 bg-background/80"
      />
    </div>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  placeholder,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{label}</Label>
      <Textarea
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-24 border-border/70 bg-background/80"
      />
    </div>
  );
}

function InlineNumericFields({
  fields,
}: {
  fields: Array<{ label: string; value: string; onChange: (value: string) => void }>;
}) {
  return (
    <div className={`grid gap-3 ${fields.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
      {fields.map((field) => (
        <TextInput key={field.label} label={field.label} value={field.value} onChange={field.onChange} />
      ))}
    </div>
  );
}

function CheckRow({
  items,
}: {
  items: Array<{ label: string; checked: boolean; onChange: (checked: boolean) => void }>;
}) {
  return (
    <div className="flex flex-wrap gap-3 rounded-xl border border-border/70 bg-muted/20 p-3">
      {items.map((item) => (
        <label key={item.label} className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm">
          <input type="checkbox" checked={item.checked} onChange={(e) => item.onChange(e.target.checked)} />
          {item.label}
        </label>
      ))}
    </div>
  );
}

function PrimaryActionButton({
  busy,
  idleLabel,
  onClick,
  disabled = false,
}: {
  busy: boolean;
  idleLabel: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button className="w-full sm:w-auto" disabled={busy || disabled} onClick={onClick}>
      {busy ? "Submitting..." : idleLabel}
    </Button>
  );
}
