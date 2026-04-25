/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ProxmoxAuthOptions } from './ProxmoxAuthOptions';
import type { SSHOptions } from './SSHOptions';
import type { UUID } from './UUID';
export type ProxmoxVMTemplateRequest = {
    agent?: boolean;
    auth?: ProxmoxAuthOptions;
    boot_order?: string;
    cleanup_image?: boolean;
    cloudinit_storage?: string;
    cores?: number;
    description?: string;
    disk_bus?: string;
    host_server_id?: UUID;
    image_url?: string;
    memory_mb?: number;
    name?: string;
    net0?: string;
    node?: string;
    proxmox_secret_id?: UUID;
    scsihw?: string;
    serial_console?: boolean;
    sockets?: number;
    ssh?: SSHOptions;
    storage?: string;
    vmid?: number;
};

