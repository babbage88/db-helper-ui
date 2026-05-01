/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UUID } from './UUID';
export type ProxmoxVMHardwareActionRequest = {
    delete?: string;
    device?: string;
    host_server_id?: UUID;
    node?: string;
    params?: Record<string, string>;
    proxmox_secret_id?: UUID;
    value?: string;
    vmid?: number;
};

