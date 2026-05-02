import type { Node } from "./columns";

export function isProxmoxHostNodeTypeNames(
  platformTypeNames: string[] = [],
  hostServerTypeNames: string[] = []
) {
  const platformNames = platformTypeNames.map((name) => name.toLowerCase());
  const hostTypeNames = hostServerTypeNames.map((name) => name.toLowerCase());
  const isProxmoxPlatform = platformNames.some((name) => name.includes("proxmox"));
  const isHypervisorType = hostTypeNames.some(
    (name) => name.includes("hypervisor") || name.includes("host")
  );

  return isProxmoxPlatform && isHypervisorType;
}

export function isProxmoxHypervisorNode(node: Node) {
  return isProxmoxHostNodeTypeNames(node.platformTypeNames, node.hostServerTypeNames);
}
