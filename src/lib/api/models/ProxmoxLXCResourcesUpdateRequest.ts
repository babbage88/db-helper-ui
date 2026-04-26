/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UUID } from './UUID';
export type ProxmoxLXCResourcesUpdateRequest = {
    bridge?: string;
    cores?: number;
    host_server_id?: UUID;
    memory_mb?: number;
    node?: string;
    proxmox_secret_id?: UUID;
    rootfs_size_gb?: number;
    swap_mb?: number;
    vlan_tag?: string;
    vmid?: number;
};

