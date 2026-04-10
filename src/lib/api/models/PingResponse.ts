/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UUID } from './UUID';
export type PingResponse = {
    /**
     * Total number of recieved packets
     */
    PacketsRecv?: number;
    /**
     * Total number of packets sent
     */
    PacketsSent?: number;
    /**
     * Error message if the operation failed
     */
    error?: string;
    /**
     * resolved ip address from hostname
     */
    ipAddr?: string;
    /**
     * Average Latency of the ping operation
     */
    latency: string;
    /**
     * Whether the ping was successful
     */
    success: boolean;
    targetHostId?: UUID;
    /**
     * Name of the target host
     */
    targetHostName: string;
};

