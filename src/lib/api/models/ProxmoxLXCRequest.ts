/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ProxmoxAuthOptions } from './ProxmoxAuthOptions';
import type { UUID } from './UUID';
export type ProxmoxLXCRequest = {
    arch?: string;
    auth?: ProxmoxAuthOptions;
    cmode?: string;
    console?: boolean;
    cores?: number;
    cpu_limit?: number;
    cpu_units?: number;
    description?: string;
    features?: string;
    host_server_id?: UUID;
    hostname?: string;
    memory?: number;
    nameserver?: string;
    net0?: string;
    node?: string;
    ostemplate?: string;
    password?: string;
    proxmox_secret_id?: UUID;
    rootfs_size?: string;
    search_domain?: string;
    ssh_public_keys?: Array<string>;
    start?: boolean;
    storage?: string;
    swap?: number;
    unprivileged?: boolean;
    vmid?: number;
};

