/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateHostServerRequest = {
    /**
     * Hostname of the server
     */
    hostname: string;
    /**
     * IP address of the server
     */
    ip_address: string;
    /**
     * Whether this server can host containers
     */
    is_container_host?: boolean;
    /**
     * Whether this server can host databases
     */
    is_db_host?: boolean;
    /**
     * Whether this server is a virtual machine
     */
    is_virtual_machine?: boolean;
    /**
     * Whether this server can host VMs
     */
    is_vm_host?: boolean;
};

