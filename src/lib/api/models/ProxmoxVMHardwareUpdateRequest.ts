/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UUID } from './UUID';
export type ProxmoxVMHardwareUpdateRequest = {
    bridge?: string;
    cores?: number;
    disk_size_gb?: number;
    host_server_id?: UUID;
    memory_mb?: number;
    node?: string;
    proxmox_secret_id?: UUID;
    sockets?: number;
    vlan_tag?: string;
    vmid?: number;
};

