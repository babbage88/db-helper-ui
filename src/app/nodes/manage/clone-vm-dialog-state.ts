"use client";

export type CloneVmState = {
  open: boolean;
  templateId: string;
  vmid: string;
  name: string;
  storage: string;
  memoryMb: string;
  minimumMemoryMb: string;
  shares: string;
  ballooningDevice: boolean;
  sockets: string;
  cores: string;
  fullClone: boolean;
  start: boolean;
  ciUser: string;
  ciPassword: string;
  overrideNetwork: boolean;
  nicModel: string;
  bridge: string;
  vlanTag: string;
  firewall: boolean;
  queues: string;
  bios: string;
  machine: string;
  scsiController: string;
  bootOrder: string;
  agentMode: "inherit" | "enabled" | "disabled";
  sshPublicKeys: string;
  ipconfig0: string;
  nameserver: string;
  searchDomain: string;
  ciSnippetsStorage: string;
  ciCustomScript: string;
  description: string;
};

export type CloneVmTemplateOption = {
  id: string;
  label: string;
  vmid?: number;
};

export function defaultCloneState(template?: CloneVmTemplateOption | null): CloneVmState {
  return {
    open: false,
    templateId: template?.id || "",
    vmid: "",
    name: template ? `${template.label.replace(/template|cloudinit/gi, "").replace(/[-_]+$/g, "") || "vm"}-clone` : "",
    storage: "",
    memoryMb: "2048",
    minimumMemoryMb: "",
    shares: "",
    ballooningDevice: false,
    sockets: "1",
    cores: "2",
    fullClone: true,
    start: false,
    ciUser: "",
    ciPassword: "",
    overrideNetwork: false,
    nicModel: "virtio",
    bridge: "",
    vlanTag: "",
    firewall: false,
    queues: "",
    bios: "",
    machine: "",
    scsiController: "",
    bootOrder: "",
    agentMode: "inherit",
    sshPublicKeys: "",
    ipconfig0: "ip=dhcp",
    nameserver: "",
    searchDomain: "",
    ciSnippetsStorage: "",
    ciCustomScript: "",
    description: "",
  };
}

function normalizeVlanTag(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > 4094) {
    throw new Error("VLAN tag must be between 1 and 4094.");
  }
  return String(parsed);
}

function normalizeOptionalPositiveIntString(value: string, fieldName: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${fieldName} must be a positive integer.`);
  }
  return String(parsed);
}

export function buildCloneNet0Value(state: CloneVmState) {
  if (!state.overrideNetwork) return undefined;
  const bridge = state.bridge.trim();
  if (!bridge) {
    throw new Error("Select a bridge when overriding template networking.");
  }
  const vlanTag = normalizeVlanTag(state.vlanTag);
  const nicModel = state.nicModel.trim() || "virtio";
  const queues = normalizeOptionalPositiveIntString(state.queues, "Queues");
  const parts = [`${nicModel}`, `bridge=${bridge}`];
  if (vlanTag) parts.push(`tag=${vlanTag}`);
  if (state.firewall) parts.push("firewall=1");
  if (queues) parts.push(`queues=${queues}`);
  return parts.join(",");
}
