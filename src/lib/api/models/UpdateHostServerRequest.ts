/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Addr } from './Addr';
import type { UUID } from './UUID';
export type UpdateHostServerRequest = {
    /**
     * Clear IP address from the server
     */
    clear_ip_address?: boolean;
    /**
     * Host server type IDs that this server supports
     */
    host_server_type_ids?: Array<UUID>;
    /**
     * Hostname of the server
     */
    hostname?: string;
    ip_address?: Addr;
    /**
     * Platform type IDs that this server supports
     */
    platform_type_ids?: Array<UUID>;
    ssh_key_id?: UUID;
    sudo_password_token_id?: UUID;
    /**
     * Username for SSH connection
     */
    username?: string;
};

