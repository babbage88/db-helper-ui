/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ProxmoxContainerListResult } from '../models/ProxmoxContainerListResult';
import type { ProxmoxVMListResult } from '../models/ProxmoxVMListResult';
import type { ProxmoxVMStartRequest } from '../models/ProxmoxVMStartRequest';
import type { ProxmoxVMStartResult } from '../models/ProxmoxVMStartResult';
import type { ProxmoxWorkloadInventoryResult } from '../models/ProxmoxWorkloadInventoryResult';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ProxmoxService {
    /**
     * List Proxmox LXC containers.
     * @returns ProxmoxContainerListResult (empty)
     * @throws ApiError
     */
    public static listProxmoxContainers(): CancelablePromise<ProxmoxContainerListResult> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/proxmox/container',
            errors: {
                400: `Invalid request`,
                401: `Unauthorized`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * List Proxmox QEMU VMs.
     * @param node Proxmox node name.
     * @param full Whether to include full VM info.
     * @returns ProxmoxVMListResult (empty)
     * @throws ApiError
     */
    public static listProxmoxVMs(
        node?: string,
        full?: boolean,
    ): CancelablePromise<ProxmoxVMListResult> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/proxmox/vm',
            query: {
                'node': node,
                'full': full,
            },
            errors: {
                400: `Invalid request`,
                401: `Unauthorized`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Start a Proxmox QEMU VM.
     * @param vmid VMID to start.
     * @param body Request body.
     * @returns ProxmoxVMStartResult (empty)
     * @throws ApiError
     */
    public static startProxmoxVm(
        vmid: number,
        body?: ProxmoxVMStartRequest,
    ): CancelablePromise<ProxmoxVMStartResult> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/proxmox/vm/{vmid}/start',
            path: {
                'vmid': vmid,
            },
            body: body,
            errors: {
                400: `Invalid request`,
                401: `Unauthorized`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * List all Proxmox QEMU VMs and LXC containers for a node.
     * @returns ProxmoxWorkloadInventoryResult (empty)
     * @throws ApiError
     */
    public static listProxmoxWorkloads(): CancelablePromise<ProxmoxWorkloadInventoryResult> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/proxmox/workload',
            errors: {
                400: `Invalid request`,
                401: `Unauthorized`,
                500: `Internal Server Error`,
            },
        });
    }
}
