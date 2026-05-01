/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ProxmoxGuestNetworkInterface } from './ProxmoxGuestNetworkInterface';
export type ProxmoxGuestSummaryResult = {
    error?: string;
    interfaces?: Array<ProxmoxGuestNetworkInterface>;
    ip_addresses?: Array<string>;
    kind?: string;
    node?: string;
    vmid?: number;
};

