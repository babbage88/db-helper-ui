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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { CloneVmState, CloneVmTemplateOption, CloneVmValidationErrors } from "./clone-vm-dialog-state";
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

const CLONE_VM_STEPS = [
  {
    id: "basics",
    label: "Basics",
    description: "Template, VM identity, storage, and clone behavior.",
  },
  {
    id: "hardware",
    label: "Hardware",
    description: "Compute, firmware, controller, and boot settings.",
  },
  {
    id: "networking",
    label: "Networking",
    description: "NIC overrides, IP config, and DNS values.",
  },
  {
    id: "cloud-init",
    label: "Cloud-init",
    description: "Guest credentials, keys, scripts, and notes.",
  },
] as const;

type CloneVmStepId = (typeof CLONE_VM_STEPS)[number]["id"];

const CLONE_VM_FIELDS_BY_STEP: Record<CloneVmStepId, Array<keyof CloneVmState>> = {
  basics: ["templateId", "vmid", "name", "storage", "fullClone", "start"],
  hardware: ["memoryMb", "minimumMemoryMb", "shares", "ballooningDevice", "sockets", "cores", "bios", "machine", "scsiController", "bootOrder", "agentMode"],
  networking: ["overrideNetwork", "nicModel", "bridge", "vlanTag", "firewall", "queues", "ipconfig0", "nameserver", "searchDomain"],
  "cloud-init": ["ciUser", "ciPassword", "ciSnippetsStorage", "sshPublicKeys", "ciCustomScript", "description"],
};

export function CloneVmDialog({
  state,
  templates,
  bridgeOptions,
  targetStorageOptions,
  snippetStorageOptions,
  busy,
  errors,
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
  errors: CloneVmValidationErrors;
  onClose: () => void;
  onSubmit: () => void;
  onChange: (state: CloneVmState) => void;
}) {
  const networkPresets = React.useMemo(() => buildCloneNetworkPresetOptions(bridgeOptions), [bridgeOptions]);
  const [activeStep, setActiveStep] = React.useState<CloneVmStepId>("basics");

  React.useEffect(() => {
    if (state.open) {
      setActiveStep("basics");
    }
  }, [state.open]);

  React.useEffect(() => {
    const firstFieldError = Object.keys(errors).find((key) => key !== "form") as keyof CloneVmState | undefined;
    if (!firstFieldError) return;
    const matchingStep = CLONE_VM_STEPS.find((step) => CLONE_VM_FIELDS_BY_STEP[step.id].includes(firstFieldError));
    if (matchingStep) {
      setActiveStep(matchingStep.id);
    }
  }, [errors]);

  const activeStepIndex = CLONE_VM_STEPS.findIndex((step) => step.id === activeStep);
  const isFirstStep = activeStepIndex <= 0;
  const isLastStep = activeStepIndex === CLONE_VM_STEPS.length - 1;
  const activeStepMeta = CLONE_VM_STEPS[activeStepIndex] ?? CLONE_VM_STEPS[0];

  function goToAdjacentStep(direction: -1 | 1) {
    const nextIndex = activeStepIndex + direction;
    if (nextIndex < 0 || nextIndex >= CLONE_VM_STEPS.length) return;
    setActiveStep(CLONE_VM_STEPS[nextIndex].id);
  }

  function renderFieldError(field: keyof CloneVmState | "form") {
    const message = errors[field];
    if (!message) return null;
    return <p className="text-sm text-destructive">{message}</p>;
  }

  return (
    <Dialog open={state.open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Clone VM From Template</DialogTitle>
          <DialogDescription>
            Create a new QEMU guest and apply cloud-init settings through the Proxmox clone endpoint.
          </DialogDescription>
        </DialogHeader>
        <Tabs value={activeStep} onValueChange={(value) => setActiveStep(value as CloneVmStepId)} className="gap-4">
          <TabsList className="grid h-auto w-full grid-cols-2 gap-2 rounded-xl bg-muted/40 p-2 md:grid-cols-4">
            {CLONE_VM_STEPS.map((step, index) => (
              <TabsTrigger
                key={step.id}
                value={step.id}
                className="h-auto min-h-14 flex-col items-start gap-0.5 px-3 py-2 text-left whitespace-normal"
              >
                <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Step {index + 1}
                </span>
                <span>{step.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="rounded-xl border border-border/60 bg-muted/10 px-4 py-3">
            <div className="text-sm font-semibold">{activeStepMeta.label}</div>
            <p className="mt-1 text-sm text-muted-foreground">{activeStepMeta.description}</p>
          </div>
          {errors.form ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {errors.form}
            </div>
          ) : null}

          <TabsContent value="basics" className="max-h-[60vh] overflow-y-auto pr-1">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Template">
                <Select value={state.templateId} onValueChange={(templateId) => onChange({ ...state, templateId })}>
                  <SelectTrigger aria-invalid={!!errors.templateId}>
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
                {renderFieldError("templateId")}
              </Field>
              <Field label="New VMID">
                <Input value={state.vmid} onChange={(event) => onChange({ ...state, vmid: event.target.value })} inputMode="numeric" placeholder="Auto" aria-invalid={!!errors.vmid} />
                {renderFieldError("vmid")}
              </Field>
              <Field label="Name">
                <Input value={state.name} onChange={(event) => onChange({ ...state, name: event.target.value })} aria-invalid={!!errors.name} />
                {renderFieldError("name")}
              </Field>
              <Field label="Target Storage">
                <StorageSelect value={state.storage} options={targetStorageOptions} emptyLabel="Template default" onChange={(storage) => onChange({ ...state, storage })} />
              </Field>
              <div className="md:col-span-2 rounded-xl border border-border/60 p-4">
                <div className="text-sm font-semibold">Clone Behavior</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Choose how the cloned guest should be created and whether it should boot immediately.
                </p>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <label className="flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm">
                    <Checkbox checked={state.fullClone} onCheckedChange={(checked) => onChange({ ...state, fullClone: checked === true })} />
                    Full clone
                  </label>
                  <label className="flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm">
                    <Checkbox checked={state.start} onCheckedChange={(checked) => onChange({ ...state, start: checked === true })} />
                    Start after clone
                  </label>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="hardware" className="max-h-[60vh] overflow-y-auto pr-1">
            <div className="rounded-xl border border-border/60 p-4">
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
                        <Input value={state.memoryMb} onChange={(event) => onChange({ ...state, memoryMb: event.target.value })} inputMode="numeric" aria-invalid={!!errors.memoryMb} />
                        {renderFieldError("memoryMb")}
                      </Field>
                      <Field label="Minimum Memory (MiB)">
                        <Input
                          value={state.minimumMemoryMb}
                          onChange={(event) => onChange({ ...state, minimumMemoryMb: event.target.value })}
                          inputMode="numeric"
                          placeholder={state.ballooningDevice ? "Optional" : "Enable ballooning first"}
                          disabled={!state.ballooningDevice}
                          aria-invalid={!!errors.minimumMemoryMb}
                        />
                        {renderFieldError("minimumMemoryMb")}
                      </Field>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Sockets">
                        <Input value={state.sockets} onChange={(event) => onChange({ ...state, sockets: event.target.value })} inputMode="numeric" aria-invalid={!!errors.sockets} />
                        {renderFieldError("sockets")}
                      </Field>
                      <Field label="Cores">
                        <Input value={state.cores} onChange={(event) => onChange({ ...state, cores: event.target.value })} inputMode="numeric" aria-invalid={!!errors.cores} />
                        {renderFieldError("cores")}
                      </Field>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Shares">
                        <Input value={state.shares} onChange={(event) => onChange({ ...state, shares: event.target.value })} inputMode="numeric" placeholder="Default 1000" aria-invalid={!!errors.shares} />
                        {renderFieldError("shares")}
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
                        <SelectTrigger aria-invalid={!!errors.bios}>
                          <SelectValue placeholder="Inherit template BIOS" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__inherit__">Inherit template</SelectItem>
                          <SelectItem value="ovmf">OVMF (UEFI)</SelectItem>
                          <SelectItem value="seabios">SeaBIOS</SelectItem>
                        </SelectContent>
                      </Select>
                      {renderFieldError("bios")}
                    </Field>
                    <Field label="Machine">
                      <Select value={state.machine || "__inherit__"} onValueChange={(machine) => onChange({ ...state, machine: machine === "__inherit__" ? "" : machine })}>
                        <SelectTrigger aria-invalid={!!errors.machine}>
                          <SelectValue placeholder="Inherit template machine" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__inherit__">Inherit template</SelectItem>
                          <SelectItem value="q35">q35</SelectItem>
                          <SelectItem value="pc-i440fx-9.0">i440fx</SelectItem>
                        </SelectContent>
                      </Select>
                      {renderFieldError("machine")}
                    </Field>
                    <Field label="SCSI Controller">
                      <Select value={state.scsiController || "__inherit__"} onValueChange={(scsiController) => onChange({ ...state, scsiController: scsiController === "__inherit__" ? "" : scsiController })}>
                        <SelectTrigger aria-invalid={!!errors.scsiController}>
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
                      {renderFieldError("scsiController")}
                    </Field>
                    <Field label="QEMU Guest Agent">
                      <Select value={state.agentMode} onValueChange={(agentMode: CloneVmState["agentMode"]) => onChange({ ...state, agentMode })}>
                        <SelectTrigger aria-invalid={!!errors.agentMode}>
                          <SelectValue placeholder="Inherit template agent setting" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="inherit">Inherit template</SelectItem>
                          <SelectItem value="enabled">Enabled</SelectItem>
                          <SelectItem value="disabled">Disabled</SelectItem>
                        </SelectContent>
                      </Select>
                      {renderFieldError("agentMode")}
                    </Field>
                    <div className="sm:col-span-2">
                      <Field label="Boot Order">
                        <Input value={state.bootOrder} onChange={(event) => onChange({ ...state, bootOrder: event.target.value })} placeholder="order=scsi0" aria-invalid={!!errors.bootOrder} />
                        {renderFieldError("bootOrder")}
                      </Field>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="networking" className="max-h-[60vh] overflow-y-auto pr-1">
            <div className="grid gap-4">
              <div className="rounded-xl border border-border/60 p-4">
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
                      <SelectTrigger aria-invalid={!!errors.overrideNetwork}>
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
                      <SelectTrigger aria-invalid={!!errors.nicModel}>
                        <SelectValue placeholder="Select NIC model" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="virtio">VirtIO</SelectItem>
                        <SelectItem value="e1000">E1000</SelectItem>
                        <SelectItem value="vmxnet3">VMXNET3</SelectItem>
                        <SelectItem value="rtl8139">RTL8139</SelectItem>
                      </SelectContent>
                    </Select>
                    {renderFieldError("nicModel")}
                  </Field>
                  <Field label="Bridge">
                    <BridgeSelect value={state.bridge} options={bridgeOptions} disabled={!state.overrideNetwork} onChange={(bridge) => onChange({ ...state, overrideNetwork: true, bridge })} />
                    {renderFieldError("bridge")}
                  </Field>
                  <Field label="VLAN Tag">
                    <VlanTagSelect value={state.vlanTag} onChange={(vlanTag) => onChange({ ...state, overrideNetwork: true, vlanTag })} disabled={!state.overrideNetwork} />
                    {renderFieldError("vlanTag")}
                  </Field>
                  <Field label="Queues">
                    <Input value={state.queues} onChange={(event) => onChange({ ...state, overrideNetwork: true, queues: event.target.value })} placeholder="Optional for VirtIO multiqueue" inputMode="numeric" disabled={!state.overrideNetwork} aria-invalid={!!errors.queues} />
                    {renderFieldError("queues")}
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

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="IP Config">
                  <Input value={state.ipconfig0} onChange={(event) => onChange({ ...state, ipconfig0: event.target.value })} placeholder="ip=dhcp" aria-invalid={!!errors.ipconfig0} />
                  {renderFieldError("ipconfig0")}
                </Field>
                <Field label="DNS">
                  <Input value={state.nameserver} onChange={(event) => onChange({ ...state, nameserver: event.target.value })} placeholder="1.1.1.1" aria-invalid={!!errors.nameserver} />
                  {renderFieldError("nameserver")}
                </Field>
                <Field label="Search Domain">
                  <Input value={state.searchDomain} onChange={(event) => onChange({ ...state, searchDomain: event.target.value })} aria-invalid={!!errors.searchDomain} />
                  {renderFieldError("searchDomain")}
                </Field>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="cloud-init" className="max-h-[60vh] overflow-y-auto pr-1">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Cloud-init User">
                <Input value={state.ciUser} onChange={(event) => onChange({ ...state, ciUser: event.target.value })} aria-invalid={!!errors.ciUser} />
                {renderFieldError("ciUser")}
              </Field>
              <Field label="Cloud-init Password">
                <Input value={state.ciPassword} onChange={(event) => onChange({ ...state, ciPassword: event.target.value })} type="password" aria-invalid={!!errors.ciPassword} />
                {renderFieldError("ciPassword")}
              </Field>
              <Field label="Snippets Storage">
                <StorageSelect value={state.ciSnippetsStorage} options={snippetStorageOptions} emptyLabel="No snippets storage" onChange={(ciSnippetsStorage) => onChange({ ...state, ciSnippetsStorage })} />
                {renderFieldError("ciSnippetsStorage")}
              </Field>
              <div className="md:col-span-2">
                <Field label="SSH Public Keys">
                  <Textarea value={state.sshPublicKeys} onChange={(event) => onChange({ ...state, sshPublicKeys: event.target.value })} placeholder="One key per line" aria-invalid={!!errors.sshPublicKeys} />
                  {renderFieldError("sshPublicKeys")}
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="Cloud-init Custom Script">
                  <Textarea value={state.ciCustomScript} onChange={(event) => onChange({ ...state, ciCustomScript: event.target.value })} aria-invalid={!!errors.ciCustomScript} />
                  {renderFieldError("ciCustomScript")}
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="Description">
                  <Textarea value={state.description} onChange={(event) => onChange({ ...state, description: event.target.value })} aria-invalid={!!errors.description} />
                  {renderFieldError("description")}
                </Field>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        <DialogFooter className="flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            Step {activeStepIndex + 1} of {CLONE_VM_STEPS.length}
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button variant="outline" onClick={() => goToAdjacentStep(-1)} disabled={busy || isFirstStep}>
              Previous
            </Button>
            {!isLastStep ? (
              <Button variant="outline" onClick={() => goToAdjacentStep(1)} disabled={busy}>
                Next
              </Button>
            ) : null}
            <Button variant="outline" onClick={onClose} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={onSubmit} disabled={busy || templates.length === 0}>
              {busy ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <CopyPlus className="mr-2 h-4 w-4" />}
              Clone VM
            </Button>
          </div>
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
