/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UUID } from './UUID';
export type ProxmoxVMTemplateRequest = {
    agent?: boolean;
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
    storage?: string;
    vmid?: number;
};

