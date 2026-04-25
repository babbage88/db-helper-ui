"use client";

import * as React from "react";
import type { Node } from "./columns";
import { ProxmoxService } from "@/lib/api/services/ProxmoxService";
import type { ProxmoxWorkload } from "@/lib/api/models/ProxmoxWorkload";
import type { ProxmoxContainer } from "@/lib/api/models/ProxmoxContainer";
import type { ProxmoxVM } from "@/lib/api/models/ProxmoxVM";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RefreshCw } from "lucide-react";
import { showErrorToast, showSuccessToast } from "@/lib/toast-utils";

type ProxmoxManagerDialogProps = {
  node: Node | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type AsyncSection =
  | "inventory"
  | "vm"
  | "lxc"
  | "template"
  | "start"
  | "pve-user"
  | "api-token";

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

const defaultVmStartForm = {
  vmid: "",
};

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

function toErrorMessage(error: any) {
  if (typeof error?.body === "string" && error.body) return error.body;
  if (typeof error?.message === "string" && error.message) return error.message;
  return "Request failed.";
}

export function ProxmoxManagerDialog({
  node,
  open,
  onOpenChange,
}: ProxmoxManagerDialogProps) {
  const [isLoadingInventory, setIsLoadingInventory] = React.useState(false);
  const [busySection, setBusySection] = React.useState<AsyncSection | null>(null);
  const [inventoryError, setInventoryError] = React.useState<string | null>(null);
  const [workloads, setWorkloads] = React.useState<ProxmoxWorkload[]>([]);
  const [vms, setVms] = React.useState<ProxmoxVM[]>([]);
  const [containers, setContainers] = React.useState<ProxmoxContainer[]>([]);
  const [apiResult, setApiResult] = React.useState<unknown>(null);

  const [vmForm, setVmForm] = React.useState(defaultVmForm);
  const [lxcForm, setLxcForm] = React.useState(defaultLxcForm);
  const [templateForm, setTemplateForm] = React.useState(defaultTemplateForm);
  const [vmStartForm, setVmStartForm] = React.useState(defaultVmStartForm);
  const [pveUserForm, setPveUserForm] = React.useState(defaultPveUserForm);
  const [apiTokenForm, setApiTokenForm] = React.useState(defaultApiTokenForm);

  const hostServerId = node?.ID;
  const hostLabel = node?.Hostname || node?.IpAddress || "Selected host";

  const refreshInventory = React.useCallback(async () => {
    if (!hostServerId) return;

    setIsLoadingInventory(true);
    setInventoryError(null);
    try {
      const [workloadResult, vmResult, containerResult] = await Promise.all([
        ProxmoxService.listProxmoxWorkloads(hostServerId, undefined, undefined, true),
        ProxmoxService.listProxmoxVMs(hostServerId, undefined, undefined, true),
        ProxmoxService.listProxmoxContainers(hostServerId, undefined, undefined, true),
      ]);
      setWorkloads(workloadResult.workloads || []);
      setVms(vmResult.vms || []);
      setContainers(containerResult.containers || []);
    } catch (error: any) {
      const message = toErrorMessage(error);
      setInventoryError(message);
      showErrorToast("Failed to load Proxmox inventory", message);
    } finally {
      setIsLoadingInventory(false);
    }
  }, [hostServerId]);

  React.useEffect(() => {
    if (!open || !hostServerId) return;
    refreshInventory();
  }, [open, hostServerId, refreshInventory]);

  React.useEffect(() => {
    if (!open) {
      setApiResult(null);
      setInventoryError(null);
    }
  }, [open]);

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
      } catch (error: any) {
        const message = toErrorMessage(error);
        setApiResult({ error: message });
        showErrorToast(successMessage, message);
      } finally {
        setBusySection(null);
      }
    },
    [refreshInventory]
  );

  if (!node) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl p-0">
        <div className="flex max-h-[90vh] flex-col">
          <DialogHeader className="border-b px-6 pt-6 pb-4">
            <DialogTitle>Proxmox Manager</DialogTitle>
            <DialogDescription>
              Manage VMs, LXC containers, users, tokens, and templates for {hostLabel}.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 overflow-y-auto px-6 py-4 lg:grid-cols-[1.2fr_1fr]">
            <div className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle>Inventory</CardTitle>
                    <CardDescription>
                      Live workload inventory from `/api/v1/proxmox/workload`, `/vm`, and `/container`.
                    </CardDescription>
                  </div>
                  <Button variant="outline" onClick={refreshInventory} disabled={isLoadingInventory}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingInventory ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {inventoryError && (
                    <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                      {inventoryError}
                    </div>
                  )}
                  <div className="grid gap-3 sm:grid-cols-3">
                    <SummaryCard label="Workloads" value={String(workloads.length)} />
                    <SummaryCard label="VMs" value={String(vms.length)} />
                    <SummaryCard label="LXCs" value={String(containers.length)} />
                  </div>
                  <WorkloadTable title="Workloads" items={workloads} kindLabel />
                  <WorkloadTable title="VMs" items={vms} />
                  <WorkloadTable title="LXCs" items={containers} />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Tabs defaultValue="vm">
                <TabsList className="grid h-auto grid-cols-3">
                  <TabsTrigger value="vm">VM</TabsTrigger>
                  <TabsTrigger value="lxc">LXC</TabsTrigger>
                  <TabsTrigger value="template">Template</TabsTrigger>
                  <TabsTrigger value="start">Start</TabsTrigger>
                  <TabsTrigger value="pve-user">PVE User</TabsTrigger>
                  <TabsTrigger value="api-token">API Token</TabsTrigger>
                </TabsList>

                <TabsContent value="vm">
                  <Card>
                    <CardHeader>
                      <CardTitle>Create VM</CardTitle>
                      <CardDescription>Calls `POST /api/v1/proxmox/vm`.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <TextInput label="VM ID" value={vmForm.vmid} onChange={(value) => setVmForm((prev) => ({ ...prev, vmid: value }))} />
                      <TextInput label="Template VMID" value={vmForm.template_vmid} onChange={(value) => setVmForm((prev) => ({ ...prev, template_vmid: value }))} />
                      <TextInput label="Name" value={vmForm.name} onChange={(value) => setVmForm((prev) => ({ ...prev, name: value }))} />
                      <TextInput label="Storage" value={vmForm.storage} onChange={(value) => setVmForm((prev) => ({ ...prev, storage: value }))} />
                      <InlineNumericFields
                        fields={[
                          { label: "Cores", value: vmForm.cores, onChange: (value) => setVmForm((prev) => ({ ...prev, cores: value })) },
                          { label: "Sockets", value: vmForm.sockets, onChange: (value) => setVmForm((prev) => ({ ...prev, sockets: value })) },
                          { label: "Memory MB", value: vmForm.memory_mb, onChange: (value) => setVmForm((prev) => ({ ...prev, memory_mb: value })) },
                        ]}
                      />
                      <TextInput label="Cloud-init User" value={vmForm.ci_user} onChange={(value) => setVmForm((prev) => ({ ...prev, ci_user: value }))} />
                      <TextInput label="Cloud-init Password" value={vmForm.ci_password} onChange={(value) => setVmForm((prev) => ({ ...prev, ci_password: value }))} />
                      <TextInput label="IP Config 0" value={vmForm.ipconfig0} onChange={(value) => setVmForm((prev) => ({ ...prev, ipconfig0: value }))} />
                      <TextInput label="Nameserver" value={vmForm.nameserver} onChange={(value) => setVmForm((prev) => ({ ...prev, nameserver: value }))} />
                      <TextInput label="Search Domain" value={vmForm.search_domain} onChange={(value) => setVmForm((prev) => ({ ...prev, search_domain: value }))} />
                      <TextareaField label="SSH Public Keys" value={vmForm.ssh_public_keys} onChange={(value) => setVmForm((prev) => ({ ...prev, ssh_public_keys: value }))} placeholder="One public key per line" />
                      <TextareaField label="Description" value={vmForm.description} onChange={(value) => setVmForm((prev) => ({ ...prev, description: value }))} />
                      <TextInput label="CI Custom Script" value={vmForm.ci_custom_script} onChange={(value) => setVmForm((prev) => ({ ...prev, ci_custom_script: value }))} />
                      <TextInput label="CI Snippets Storage" value={vmForm.ci_snippets_storage} onChange={(value) => setVmForm((prev) => ({ ...prev, ci_snippets_storage: value }))} />
                      <CheckRow
                        items={[
                          { label: "Full clone", checked: vmForm.full_clone, onChange: (checked) => setVmForm((prev) => ({ ...prev, full_clone: checked })) },
                          { label: "Start after create", checked: vmForm.start, onChange: (checked) => setVmForm((prev) => ({ ...prev, start: checked })) },
                        ]}
                      />
                      <Button
                        className="w-full"
                        disabled={busySection === "vm"}
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
                      >
                        {busySection === "vm" ? "Submitting..." : "Create VM"}
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="lxc">
                  <Card>
                    <CardHeader>
                      <CardTitle>Create LXC</CardTitle>
                      <CardDescription>Calls `POST /api/v1/proxmox/lxc`.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <TextInput label="VMID" value={lxcForm.vmid} onChange={(value) => setLxcForm((prev) => ({ ...prev, vmid: value }))} />
                      <TextInput label="Hostname" value={lxcForm.hostname} onChange={(value) => setLxcForm((prev) => ({ ...prev, hostname: value }))} />
                      <TextInput label="OS Template" value={lxcForm.ostemplate} onChange={(value) => setLxcForm((prev) => ({ ...prev, ostemplate: value }))} />
                      <TextInput label="Storage" value={lxcForm.storage} onChange={(value) => setLxcForm((prev) => ({ ...prev, storage: value }))} />
                      <TextInput label="RootFS Size" value={lxcForm.rootfs_size} onChange={(value) => setLxcForm((prev) => ({ ...prev, rootfs_size: value }))} />
                      <InlineNumericFields
                        fields={[
                          { label: "Memory", value: lxcForm.memory, onChange: (value) => setLxcForm((prev) => ({ ...prev, memory: value })) },
                          { label: "Swap", value: lxcForm.swap, onChange: (value) => setLxcForm((prev) => ({ ...prev, swap: value })) },
                          { label: "Cores", value: lxcForm.cores, onChange: (value) => setLxcForm((prev) => ({ ...prev, cores: value })) },
                        ]}
                      />
                      <TextInput label="Password" value={lxcForm.password} onChange={(value) => setLxcForm((prev) => ({ ...prev, password: value }))} />
                      <TextInput label="Network net0" value={lxcForm.net0} onChange={(value) => setLxcForm((prev) => ({ ...prev, net0: value }))} />
                      <TextInput label="Nameserver" value={lxcForm.nameserver} onChange={(value) => setLxcForm((prev) => ({ ...prev, nameserver: value }))} />
                      <TextInput label="Search Domain" value={lxcForm.search_domain} onChange={(value) => setLxcForm((prev) => ({ ...prev, search_domain: value }))} />
                      <TextareaField label="SSH Public Keys" value={lxcForm.ssh_public_keys} onChange={(value) => setLxcForm((prev) => ({ ...prev, ssh_public_keys: value }))} placeholder="One public key per line" />
                      <TextareaField label="Description" value={lxcForm.description} onChange={(value) => setLxcForm((prev) => ({ ...prev, description: value }))} />
                      <TextInput label="Features" value={lxcForm.features} onChange={(value) => setLxcForm((prev) => ({ ...prev, features: value }))} />
                      <TextInput label="Architecture" value={lxcForm.arch} onChange={(value) => setLxcForm((prev) => ({ ...prev, arch: value }))} />
                      <TextInput label="Console Mode" value={lxcForm.cmode} onChange={(value) => setLxcForm((prev) => ({ ...prev, cmode: value }))} />
                      <InlineNumericFields
                        fields={[
                          { label: "CPU Limit", value: lxcForm.cpu_limit, onChange: (value) => setLxcForm((prev) => ({ ...prev, cpu_limit: value })) },
                          { label: "CPU Units", value: lxcForm.cpu_units, onChange: (value) => setLxcForm((prev) => ({ ...prev, cpu_units: value })) },
                        ]}
                      />
                      <CheckRow
                        items={[
                          { label: "Console enabled", checked: lxcForm.console, onChange: (checked) => setLxcForm((prev) => ({ ...prev, console: checked })) },
                          { label: "Start after create", checked: lxcForm.start, onChange: (checked) => setLxcForm((prev) => ({ ...prev, start: checked })) },
                          { label: "Unprivileged", checked: lxcForm.unprivileged, onChange: (checked) => setLxcForm((prev) => ({ ...prev, unprivileged: checked })) },
                        ]}
                      />
                      <Button
                        className="w-full"
                        disabled={busySection === "lxc"}
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
                      >
                        {busySection === "lxc" ? "Submitting..." : "Create LXC"}
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="template">
                  <Card>
                    <CardHeader>
                      <CardTitle>Create VM Template</CardTitle>
                      <CardDescription>Calls `POST /api/v1/proxmox/vm/template`.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <TextInput label="VMID" value={templateForm.vmid} onChange={(value) => setTemplateForm((prev) => ({ ...prev, vmid: value }))} />
                      <TextInput label="Name" value={templateForm.name} onChange={(value) => setTemplateForm((prev) => ({ ...prev, name: value }))} />
                      <TextInput label="Image URL" value={templateForm.image_url} onChange={(value) => setTemplateForm((prev) => ({ ...prev, image_url: value }))} />
                      <TextInput label="Storage" value={templateForm.storage} onChange={(value) => setTemplateForm((prev) => ({ ...prev, storage: value }))} />
                      <InlineNumericFields
                        fields={[
                          { label: "Cores", value: templateForm.cores, onChange: (value) => setTemplateForm((prev) => ({ ...prev, cores: value })) },
                          { label: "Sockets", value: templateForm.sockets, onChange: (value) => setTemplateForm((prev) => ({ ...prev, sockets: value })) },
                          { label: "Memory MB", value: templateForm.memory_mb, onChange: (value) => setTemplateForm((prev) => ({ ...prev, memory_mb: value })) },
                        ]}
                      />
                      <TextInput label="net0" value={templateForm.net0} onChange={(value) => setTemplateForm((prev) => ({ ...prev, net0: value }))} />
                      <TextareaField label="Description" value={templateForm.description} onChange={(value) => setTemplateForm((prev) => ({ ...prev, description: value }))} />
                      <TextInput label="Boot Order" value={templateForm.boot_order} onChange={(value) => setTemplateForm((prev) => ({ ...prev, boot_order: value }))} />
                      <TextInput label="Cloud-init Storage" value={templateForm.cloudinit_storage} onChange={(value) => setTemplateForm((prev) => ({ ...prev, cloudinit_storage: value }))} />
                      <TextInput label="Disk Bus" value={templateForm.disk_bus} onChange={(value) => setTemplateForm((prev) => ({ ...prev, disk_bus: value }))} />
                      <TextInput label="SCSI HW" value={templateForm.scsihw} onChange={(value) => setTemplateForm((prev) => ({ ...prev, scsihw: value }))} />
                      <CheckRow
                        items={[
                          { label: "QEMU agent", checked: templateForm.agent, onChange: (checked) => setTemplateForm((prev) => ({ ...prev, agent: checked })) },
                          { label: "Cleanup image", checked: templateForm.cleanup_image, onChange: (checked) => setTemplateForm((prev) => ({ ...prev, cleanup_image: checked })) },
                          { label: "Serial console", checked: templateForm.serial_console, onChange: (checked) => setTemplateForm((prev) => ({ ...prev, serial_console: checked })) },
                        ]}
                      />
                      <Button
                        className="w-full"
                        disabled={busySection === "template"}
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
                      >
                        {busySection === "template" ? "Submitting..." : "Create VM Template"}
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="start">
                  <Card>
                    <CardHeader>
                      <CardTitle>Start VM</CardTitle>
                      <CardDescription>Calls `POST /api/v1/proxmox/vm/{'{vmid}'}/start`.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <TextInput label="VMID" value={vmStartForm.vmid} onChange={(value) => setVmStartForm({ vmid: value })} />
                      <Button
                        className="w-full"
                        disabled={busySection === "start" || !parseInteger(vmStartForm.vmid)}
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
                      >
                        {busySection === "start" ? "Submitting..." : "Start VM"}
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="pve-user">
                  <Card>
                    <CardHeader>
                      <CardTitle>Create PVE User</CardTitle>
                      <CardDescription>Calls `POST /api/v1/proxmox/pve-user`.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <TextInput label="Username" value={pveUserForm.username} onChange={(value) => setPveUserForm((prev) => ({ ...prev, username: value }))} />
                      <TextInput label="Realm" value={pveUserForm.realm} onChange={(value) => setPveUserForm((prev) => ({ ...prev, realm: value }))} />
                      <TextInput label="Password" value={pveUserForm.password} onChange={(value) => setPveUserForm((prev) => ({ ...prev, password: value }))} />
                      <TextareaField label="Comment" value={pveUserForm.comment} onChange={(value) => setPveUserForm((prev) => ({ ...prev, comment: value }))} />
                      <CheckRow
                        items={[
                          { label: "Force recreate", checked: pveUserForm.force, onChange: (checked) => setPveUserForm((prev) => ({ ...prev, force: checked })) },
                        ]}
                      />
                      <Button
                        className="w-full"
                        disabled={busySection === "pve-user"}
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
                      >
                        {busySection === "pve-user" ? "Submitting..." : "Create PVE User"}
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="api-token">
                  <Card>
                    <CardHeader>
                      <CardTitle>Create API Token</CardTitle>
                      <CardDescription>Calls `POST /api/v1/proxmox/api-token`.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <TextInput label="Username" value={apiTokenForm.username} onChange={(value) => setApiTokenForm((prev) => ({ ...prev, username: value }))} />
                      <TextInput label="Realm" value={apiTokenForm.realm} onChange={(value) => setApiTokenForm((prev) => ({ ...prev, realm: value }))} />
                      <TextInput label="User ID" value={apiTokenForm.userid} onChange={(value) => setApiTokenForm((prev) => ({ ...prev, userid: value }))} />
                      <TextInput label="Token ID" value={apiTokenForm.token_id} onChange={(value) => setApiTokenForm((prev) => ({ ...prev, token_id: value }))} />
                      <TextInput label="Role" value={apiTokenForm.role} onChange={(value) => setApiTokenForm((prev) => ({ ...prev, role: value }))} />
                      <TextInput label="ACL Path" value={apiTokenForm.acl_path} onChange={(value) => setApiTokenForm((prev) => ({ ...prev, acl_path: value }))} />
                      <TextInput label="Expiration Date" value={apiTokenForm.expiration_date} onChange={(value) => setApiTokenForm((prev) => ({ ...prev, expiration_date: value }))} placeholder="YYYY-MM-DD or RFC3339" />
                      <TextInput label="Days Valid" value={apiTokenForm.days_valid} onChange={(value) => setApiTokenForm((prev) => ({ ...prev, days_valid: value }))} />
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
                      <Button
                        className="w-full"
                        disabled={busySection === "api-token"}
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
                      >
                        {busySection === "api-token" ? "Submitting..." : "Create API Token"}
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <Card>
                <CardHeader>
                  <CardTitle>Last Response</CardTitle>
                  <CardDescription>Latest payload returned from a Proxmox endpoint call.</CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="max-h-[360px] overflow-auto rounded-md bg-muted p-3 text-xs">
                    {JSON.stringify(apiResult, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function WorkloadTable({
  title,
  items,
  kindLabel = false,
}: {
  title: string;
  items: Array<ProxmoxWorkload | ProxmoxVM | ProxmoxContainer>;
  kindLabel?: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">{title}</h3>
        <Badge variant="outline">{items.length}</Badge>
      </div>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Name</th>
              <th className="px-3 py-2 text-left font-medium">VMID</th>
              {kindLabel && <th className="px-3 py-2 text-left font-medium">Kind</th>}
              <th className="px-3 py-2 text-left font-medium">Status</th>
              <th className="px-3 py-2 text-left font-medium">Node</th>
              <th className="px-3 py-2 text-left font-medium">CPU</th>
              <th className="px-3 py-2 text-left font-medium">Memory</th>
              <th className="px-3 py-2 text-left font-medium">Disk</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-center text-muted-foreground" colSpan={kindLabel ? 8 : 7}>
                  No items returned.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={`${item.vmid}-${item.name}`} className="border-t">
                  <td className="px-3 py-2">{item.name || "-"}</td>
                  <td className="px-3 py-2">{item.vmid ?? "-"}</td>
                  {kindLabel && <td className="px-3 py-2">{(item as ProxmoxWorkload).kind || "-"}</td>}
                  <td className="px-3 py-2">{item.status || "-"}</td>
                  <td className="px-3 py-2">{item.node || "-"}</td>
                  <td className="px-3 py-2">{typeof item.cpu === "number" ? item.cpu.toFixed(2) : "-"}</td>
                  <td className="px-3 py-2">{formatSize(item.mem, item.maxmem)}</td>
                  <td className="px-3 py-2">{formatSize(item.disk, item.maxdisk)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
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

function TextInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Textarea value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
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
        <TextInput
          key={field.label}
          label={field.label}
          value={field.value}
          onChange={field.onChange}
        />
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
    <div className="grid gap-2 sm:grid-cols-2">
      {items.map((item) => (
        <label key={item.label} className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={item.checked}
            onChange={(e) => item.onChange(e.target.checked)}
          />
          {item.label}
        </label>
      ))}
    </div>
  );
}
