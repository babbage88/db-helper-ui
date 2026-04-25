import type { Node } from "./columns";

export function isProxmoxHypervisorNode(node: Node) {
  const platformNames = (node.platformTypeNames || []).map((name) => name.toLowerCase());
  const hostTypeNames = (node.hostServerTypeNames || []).map((name) => name.toLowerCase());
  const isProxmoxPlatform = platformNames.some((name) => name.includes("proxmox"));
  const isHypervisorType = hostTypeNames.some(
    (name) => name.includes("hypervisor") || name.includes("host")
  );

  return isProxmoxPlatform && isHypervisorType;
}
