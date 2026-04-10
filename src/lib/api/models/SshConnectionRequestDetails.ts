/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UUID } from './UUID';
/**
 * SSH Connection Request
 */
export type SshConnectionRequestDetails = {
    /**
     * Terminal column width
     */
    columns?: number;
    hostServerId: UUID;
    /**
     * Terminal row height
     */
    rows?: number;
    /**
     * Username to connect as on the remote server
     */
    username: string;
};

