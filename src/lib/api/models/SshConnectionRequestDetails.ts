/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * SSH Connection Request
 */
export type SshConnectionRequestDetails = {
    /**
     * Terminal column width
     */
    columns?: number;
    /**
     * Host server ID to connect to
     */
    hostServerId: string;
    /**
     * Terminal row height
     */
    rows?: number;
    /**
     * Username to connect as on the remote server
     */
    username: string;
};

