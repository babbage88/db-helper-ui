/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type UpdateHostServerRequest = {
    /**
     * Host server type IDs that this server supports
     */
    host_server_type_ids?: Array<string>;
    /**
     * Hostname of the server
     */
    hostname?: string;
    /**
     * IP address of the server
     */
    ip_address?: string;
    /**
     * Platform type IDs that this server supports
     */
    platform_type_ids?: Array<string>;
    /**
     * SSH key ID for authentication
     */
    ssh_key_id?: string;
    /**
     * Optional sudo password token ID
     */
    sudo_password_token_id?: string;
    /**
     * Username for SSH connection
     */
    username?: string;
};

