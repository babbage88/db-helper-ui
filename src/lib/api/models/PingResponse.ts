/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type PingResponse = {
    /**
     * Error message if the operation failed
     */
    error?: string;
    /**
     * Latency of the ping operation
     */
    latency: string;
    /**
     * Whether the ping was successful
     */
    success: boolean;
    /**
     * ID of the target host server (if applicable)
     */
    targetHostId?: string;
    /**
     * Name of the target host
     */
    targetHostName: string;
};

