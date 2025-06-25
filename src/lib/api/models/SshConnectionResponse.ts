/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * SSH Connection Response
 */
export type SshConnectionResponse = {
    /**
     * Unique connection identifier
     */
    connectionId?: string;
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

