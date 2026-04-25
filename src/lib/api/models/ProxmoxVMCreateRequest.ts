/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UUID } from './UUID';
export type ProxmoxVMCreateRequest = {
    ci_custom_script?: string;
    ci_password?: string;
    ci_snippets_storage?: string;
    ci_user?: string;
    cores?: number;
    description?: string;
    full_clone?: boolean;
    host_server_id?: UUID;
    ipconfig0?: string;
    memory_mb?: number;
    name?: string;
    nameserver?: string;
    node?: string;
    proxmox_secret_id?: UUID;
    search_domain?: string;
    sockets?: number;
    ssh_public_keys?: Array<string>;
    start?: boolean;
    storage?: string;
    template_vmid?: number;
    vmid?: number;
};

