/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UUID } from './UUID';
export type NetworkProbeResponse = {
    /**
     * Error message if the operation failed
     */
    error?: string;
    /**
     * Latency of the probe operation
     */
    latency: string;
    /**
     * Whether the probe was successful
     */
    success: boolean;
    targetHostId?: UUID;
    /**
     * Name of the target host
     */
    targetHostName: string;
    /**
     * Port number that was probed
     */
    targetPort: number;
};

