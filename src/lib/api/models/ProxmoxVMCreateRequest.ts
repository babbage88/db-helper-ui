/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ProxmoxAuthOptions } from './ProxmoxAuthOptions';
import type { SSHOptions } from './SSHOptions';
export type ProxmoxVMCreateRequest = {
    auth?: ProxmoxAuthOptions;
    ci_custom_script?: string;
    ci_password?: string;
    ci_snippets_storage?: string;
    ci_user?: string;
    cores?: number;
    description?: string;
    full_clone?: boolean;
    ipconfig0?: string;
    memory_mb?: number;
    name?: string;
    nameserver?: string;
    node?: string;
    search_domain?: string;
    sockets?: number;
    ssh?: SSHOptions;
    ssh_public_keys?: Array<string>;
    start?: boolean;
    storage?: string;
    template_vmid?: number;
    vmid?: number;
};

