"use client";

import * as React from "react";
import { CopyPlus, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { CloneVmState, CloneVmTemplateOption } from "./clone-vm-dialog-state";
import { buildCloneNet0Value } from "./clone-vm-dialog-state";
import { BridgeSelect, Field } from "./proxmox-form-controls";
import { Label } from "@/components/ui/label";

function getCloneNet0Preview(state: CloneVmState) {
  if (!state.overrideNetwork) return "Template net0 unchanged";
  try {
    return buildCloneNet0Value(state) || "Template net0 unchanged";
  } catch (error: unknown) {
    return error instanceof Error ? error.message : "Invalid network override";
  }
}

function buildCloneNetworkPresetOptions(bridgeOptions: string[]) {
  const bridges = bridgeOptions.length ? bridgeOptions : ["vmbr0"];
  return bridges.flatMap((bridge) => [
    { label: `VirtIO on ${bridge}`, value: `virtio:${bridge}:plain`, nicModel: "virtio", bridge, firewall: false, queues: "" },
    { label: `VirtIO on ${bridge}, firewall`, value: `virtio:${bridge}:firewall`, nicModel: "virtio", bridge, firewall: true, queues: "" },
    { label: `VirtIO multi-queue on ${bridge}`, value: `virtio:${bridge}:queues8`, nicModel: "virtio", bridge, firewall: false, queues: "8" },
    { label: `E1000 on ${bridge}`, value: `e1000:${bridge}:plain`, nicModel: "e1000", bridge, firewall: false, queues: "" },
  ]);
}

export function CloneVmDialog({
  state,
  templates,
  bridgeOptions,
  targetStorageOptions,
  snippetStorageOptions,
  busy,
  onClose,
  onSubmit,
  onChange,
}: {
  state: CloneVmState;
  templates: CloneVmTemplateOption[];
  bridgeOptions: string[];
  targetStorageOptions: string[];
  snippetStorageOptions: string[];
  busy: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onChange: (state: CloneVmState) => void;
}) {
  const networkPresets = React.useMemo(() => buildCloneNetworkPresetOptions(bridgeOptions), [bridgeOptions]);

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
            <StorageSelect value={state.storage} options={targetStorageOptions} emptyLabel="Template default" onChange={(storage) => onChange({ ...state, storage })} />
          </Field>

          <div className="md:col-span-2 rounded-xl border border-border/60 p-4">
            <div className="text-sm font-semibold">Clone Hardware Overrides</div>
            <p className="mt-1 text-sm text-muted-foreground">
              Apply VM compute and firmware settings during clone instead of updating the guest afterward.
            </p>
            <div className="mt-4 grid items-start gap-4 xl:grid-cols-2">
              <div className="rounded-xl border border-border/60 p-4">
                <div className="mb-4">
                  <div className="text-sm font-semibold">Compute</div>
                  <p className="mt-1 text-xs text-muted-foreground">Memory, ballooning, and CPU topology.</p>
                </div>
                <div className="grid gap-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Memory (MiB)">
                      <Input value={state.memoryMb} onChange={(event) => onChange({ ...state, memoryMb: event.target.value })} inputMode="numeric" />
                    </Field>
                    <Field label="Minimum Memory (MiB)">
                      <Input
                        value={state.minimumMemoryMb}
                        onChange={(event) => onChange({ ...state, minimumMemoryMb: event.target.value })}
                        inputMode="numeric"
                        placeholder={state.ballooningDevice ? "Optional" : "Enable ballooning first"}
                        disabled={!state.ballooningDevice}
                      />
                    </Field>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Sockets">
                      <Input value={state.sockets} onChange={(event) => onChange({ ...state, sockets: event.target.value })} inputMode="numeric" />
                    </Field>
                    <Field label="Cores">
                      <Input value={state.cores} onChange={(event) => onChange({ ...state, cores: event.target.value })} inputMode="numeric" />
                    </Field>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Shares">
                      <Input value={state.shares} onChange={(event) => onChange({ ...state, shares: event.target.value })} inputMode="numeric" placeholder="Default 1000" />
                    </Field>
                    <div className="space-y-2">
                      <Label>Memory Ballooning</Label>
                      <label className="flex min-h-10 items-center justify-between gap-4 rounded-md border border-border/60 bg-muted/15 px-3 py-2 text-sm">
                        <div className="min-w-0">
                          <div className="font-medium text-foreground">Enable ballooning</div>
                          <div className="text-xs text-muted-foreground">Allow reclaim down to minimum memory</div>
                        </div>
                        <Checkbox checked={state.ballooningDevice} onCheckedChange={(checked) => onChange({ ...state, ballooningDevice: checked === true })} />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border/60 p-4">
                <div className="mb-4">
                  <div className="text-sm font-semibold">Platform</div>
                  <p className="mt-1 text-xs text-muted-foreground">Firmware, controller, guest agent, and boot behavior.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="BIOS">
                    <Select value={state.bios || "__inherit__"} onValueChange={(bios) => onChange({ ...state, bios: bios === "__inherit__" ? "" : bios })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Inherit template BIOS" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__inherit__">Inherit template</SelectItem>
                        <SelectItem value="ovmf">OVMF (UEFI)</SelectItem>
                        <SelectItem value="seabios">SeaBIOS</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Machine">
                    <Select value={state.machine || "__inherit__"} onValueChange={(machine) => onChange({ ...state, machine: machine === "__inherit__" ? "" : machine })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Inherit template machine" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__inherit__">Inherit template</SelectItem>
                        <SelectItem value="q35">q35</SelectItem>
                        <SelectItem value="pc-i440fx-9.0">i440fx</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="SCSI Controller">
                    <Select value={state.scsiController || "__inherit__"} onValueChange={(scsiController) => onChange({ ...state, scsiController: scsiController === "__inherit__" ? "" : scsiController })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Inherit template SCSI controller" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__inherit__">Inherit template</SelectItem>
                        <SelectItem value="virtio-scsi-single">VirtIO SCSI single</SelectItem>
                        <SelectItem value="virtio-scsi-pci">VirtIO SCSI</SelectItem>
                        <SelectItem value="lsi">LSI 53C895A</SelectItem>
                        <SelectItem value="megasas">MegaRAID SAS</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="QEMU Guest Agent">
                    <Select value={state.agentMode} onValueChange={(agentMode: CloneVmState["agentMode"]) => onChange({ ...state, agentMode })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Inherit template agent setting" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inherit">Inherit template</SelectItem>
                        <SelectItem value="enabled">Enabled</SelectItem>
                        <SelectItem value="disabled">Disabled</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="Boot Order">
                      <Input value={state.bootOrder} onChange={(event) => onChange({ ...state, bootOrder: event.target.value })} placeholder="order=scsi0" />
                    </Field>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Field label="Cloud-init User">
            <Input value={state.ciUser} onChange={(event) => onChange({ ...state, ciUser: event.target.value })} />
          </Field>
          <Field label="Cloud-init Password">
            <Input value={state.ciPassword} onChange={(event) => onChange({ ...state, ciPassword: event.target.value })} type="password" />
          </Field>

          <div className="md:col-span-2 rounded-xl border border-border/60 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="text-sm font-semibold">Network Override</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Keep the template NIC as-is, or choose a target bridge and optional VLAN tag for `net0`.
                </p>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={state.overrideNetwork} onCheckedChange={(checked) => onChange({ ...state, overrideNetwork: checked === true })} />
                Override template network
              </label>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Network Profile">
                <Select
                  value={undefined}
                  disabled={!state.overrideNetwork}
                  onValueChange={(value) => {
                    const preset = networkPresets.find((option) => option.value === value);
                    if (!preset) return;
                    onChange({
                      ...state,
                      overrideNetwork: true,
                      nicModel: preset.nicModel,
                      bridge: preset.bridge,
                      firewall: preset.firewall,
                      queues: preset.queues,
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Apply a guided network preset" />
                  </SelectTrigger>
                  <SelectContent>
                    {networkPresets.map((preset) => (
                      <SelectItem key={preset.value} value={preset.value}>
                        {preset.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="NIC Model">
                <Select value={state.nicModel} disabled={!state.overrideNetwork} onValueChange={(nicModel) => onChange({ ...state, overrideNetwork: true, nicModel })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select NIC model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="virtio">VirtIO</SelectItem>
                    <SelectItem value="e1000">E1000</SelectItem>
                    <SelectItem value="vmxnet3">VMXNET3</SelectItem>
                    <SelectItem value="rtl8139">RTL8139</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Bridge">
                <BridgeSelect value={state.bridge} options={bridgeOptions} disabled={!state.overrideNetwork} onChange={(bridge) => onChange({ ...state, overrideNetwork: true, bridge })} />
              </Field>
              <Field label="VLAN Tag">
                <VlanTagSelect value={state.vlanTag} onChange={(vlanTag) => onChange({ ...state, overrideNetwork: true, vlanTag })} disabled={!state.overrideNetwork} />
              </Field>
              <Field label="Queues">
                <Input value={state.queues} onChange={(event) => onChange({ ...state, overrideNetwork: true, queues: event.target.value })} placeholder="Optional for VirtIO multiqueue" inputMode="numeric" disabled={!state.overrideNetwork} />
              </Field>
              <label className="flex items-center gap-2 self-end rounded-lg border border-border/60 px-3 py-2 text-sm">
                <Checkbox checked={state.firewall} disabled={!state.overrideNetwork} onCheckedChange={(checked) => onChange({ ...state, overrideNetwork: true, firewall: checked === true })} />
                Enable firewall
              </label>
            </div>
            <div className="mt-4 rounded-lg bg-muted/30 p-3">
              <div className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Generated net0</div>
              <div className="mt-2 font-mono text-xs text-foreground">{getCloneNet0Preview(state)}</div>
            </div>
          </div>

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
            <StorageSelect value={state.ciSnippetsStorage} options={snippetStorageOptions} emptyLabel="No snippets storage" onChange={(ciSnippetsStorage) => onChange({ ...state, ciSnippetsStorage })} />
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

function VlanTagSelect({
  value,
  disabled = false,
  onChange,
}: {
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  const presetValues = ["", "10", "20", "30", "40", "50", "100", "200", "300", "400"];
  const normalizedValue = value.trim();
  const usesCustomValue = normalizedValue !== "" && !presetValues.includes(normalizedValue);
  const selectValue = usesCustomValue ? "__custom__" : normalizedValue || "__untagged__";

  return (
    <div className="grid gap-3">
      <Select
        value={selectValue}
        disabled={disabled}
        onValueChange={(next) => {
          if (next === "__custom__") return;
          onChange(next === "__untagged__" ? "" : next);
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select VLAN mode" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__untagged__">Untagged</SelectItem>
          {presetValues
            .filter((preset) => preset !== "")
            .map((preset) => (
              <SelectItem key={preset} value={preset}>
                VLAN {preset}
              </SelectItem>
            ))}
          <SelectItem value="__custom__">Custom VLAN ID</SelectItem>
        </SelectContent>
      </Select>
      {usesCustomValue ? (
        <Input value={value} onChange={(event) => onChange(event.target.value)} placeholder="Enter VLAN ID" inputMode="numeric" disabled={disabled} />
      ) : null}
    </div>
  );
}

function StorageSelect({
  value,
  options,
  emptyLabel,
  disabled = false,
  onChange,
}: {
  value: string;
  options: string[];
  emptyLabel: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  const normalizedOptions = React.useMemo(() => {
    const next = new Set(options);
    if (value) next.add(value);
    return [...next].sort();
  }, [options, value]);

  const selectValue = value || "__empty__";

  return (
    <Select value={selectValue} disabled={disabled} onValueChange={(next) => onChange(next === "__empty__" ? "" : next)}>
      <SelectTrigger>
        <SelectValue placeholder={emptyLabel} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__empty__">{emptyLabel}</SelectItem>
        {normalizedOptions.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
