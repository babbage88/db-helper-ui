"use client";

import * as z from "zod";

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

export type CloneVmValidationErrors = Partial<Record<keyof CloneVmState | "form", string>>;

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

const sshPublicKeyLinePattern =
  /^(?:ssh-(?:rsa|ed25519)|ecdsa-sha2-nistp(?:256|384|521)|sk-ssh-ed25519@openssh\.com|sk-ecdsa-sha2-nistp256@openssh\.com)\s+[A-Za-z0-9+/=]+(?:\s+.+)?$/;

function validateOptionalPositiveInteger(fieldName: string) {
  return z
    .string()
    .superRefine((value, ctx) => {
      const trimmed = value.trim();
      if (!trimmed) return;
      const parsed = Number.parseInt(trimmed, 10);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${fieldName} must be a positive integer.`,
        });
      }
    });
}

function validateRequiredPositiveInteger(fieldName: string) {
  return z
    .string()
    .superRefine((value, ctx) => {
      const trimmed = value.trim();
      if (!trimmed) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${fieldName} is required.`,
        });
        return;
      }
      const parsed = Number.parseInt(trimmed, 10);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${fieldName} must be a positive integer.`,
        });
      }
    });
}

const cloneVmSchema = z
  .object({
    open: z.boolean(),
    templateId: z.string().trim().min(1, "Select a template."),
    vmid: validateOptionalPositiveInteger("VMID"),
    name: z.string().trim().min(1, "Name is required."),
    storage: z.string(),
    memoryMb: validateRequiredPositiveInteger("Memory"),
    minimumMemoryMb: validateOptionalPositiveInteger("Minimum memory"),
    shares: validateOptionalPositiveInteger("Shares"),
    ballooningDevice: z.boolean(),
    sockets: validateRequiredPositiveInteger("Sockets"),
    cores: validateRequiredPositiveInteger("Cores"),
    fullClone: z.boolean(),
    start: z.boolean(),
    ciUser: z.string(),
    ciPassword: z.string(),
    overrideNetwork: z.boolean(),
    nicModel: z.string(),
    bridge: z.string(),
    vlanTag: z.string(),
    firewall: z.boolean(),
    queues: validateOptionalPositiveInteger("Queues"),
    bios: z.string(),
    machine: z.string(),
    scsiController: z.string(),
    bootOrder: z.string(),
    agentMode: z.enum(["inherit", "enabled", "disabled"]),
    sshPublicKeys: z.string(),
    ipconfig0: z.string(),
    nameserver: z.string(),
    searchDomain: z.string(),
    ciSnippetsStorage: z.string(),
    ciCustomScript: z.string(),
    description: z.string(),
  })
  .superRefine((state, ctx) => {
    if (state.overrideNetwork && !state.bridge.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["bridge"],
        message: "Select a bridge when overriding template networking.",
      });
    }

    if (!state.ballooningDevice && state.minimumMemoryMb.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["minimumMemoryMb"],
        message: "Enable ballooning before setting minimum memory.",
      });
    }

    if (state.vlanTag.trim()) {
      try {
        normalizeVlanTag(state.vlanTag);
      } catch (error: unknown) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["vlanTag"],
          message: error instanceof Error ? error.message : "Invalid VLAN tag.",
        });
      }
    }

    if (state.overrideNetwork && state.queues.trim()) {
      try {
        normalizeOptionalPositiveIntString(state.queues, "Queues");
      } catch (error: unknown) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["queues"],
          message: error instanceof Error ? error.message : "Invalid queues value.",
        });
      }
    }

    const sshLines = state.sshPublicKeys
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const invalidKey = sshLines.find((line) => !sshPublicKeyLinePattern.test(line));
    if (invalidKey) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sshPublicKeys"],
        message: "Each SSH public key must be a single valid OpenSSH public key line.",
      });
    }
  });

export function validateCloneVmState(state: CloneVmState) {
  const result = cloneVmSchema.safeParse(state);
  if (result.success) {
    return { success: true as const, errors: {} as CloneVmValidationErrors };
  }

  const errors: CloneVmValidationErrors = {};
  for (const issue of result.error.issues) {
    const field = (issue.path[0] as keyof CloneVmState | undefined) ?? "form";
    if (!errors[field]) {
      errors[field] = issue.message;
    }
  }
  return { success: false as const, errors };
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
