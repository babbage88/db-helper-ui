/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UUID } from './UUID';
/**
 * SSH Connection Response
 */
export type SshConnectionResponse = {
    connectionId?: UUID;
    /**
     * Error message if connection failed
     */
    error?: string;
    /**
     * Whether the connection was successful
     */
    success?: boolean;
    /**
     * WebSocket URL for terminal communication
     */
    websocketUrl?: string;
};

