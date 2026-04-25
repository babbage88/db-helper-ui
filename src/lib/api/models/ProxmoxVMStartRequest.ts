/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ProxmoxAuthOptions } from './ProxmoxAuthOptions';
import type { UUID } from './UUID';
export type ProxmoxVMStartRequest = {
    auth?: ProxmoxAuthOptions;
    host_server_id?: UUID;
    node?: string;
    proxmox_secret_id?: UUID;
    vmid?: number;
};

