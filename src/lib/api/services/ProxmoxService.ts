/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ProxmoxAPITokenCreateRequest } from '../models/ProxmoxAPITokenCreateRequest';
import type { ProxmoxAPITokenCreateResult } from '../models/ProxmoxAPITokenCreateResult';
import type { ProxmoxContainerListResult } from '../models/ProxmoxContainerListResult';
import type { ProxmoxLXCRequest } from '../models/ProxmoxLXCRequest';
import type { ProxmoxLXCResult } from '../models/ProxmoxLXCResult';
import type { ProxmoxPVEUserCreateRequest } from '../models/ProxmoxPVEUserCreateRequest';
import type { ProxmoxPVEUserCreateResult } from '../models/ProxmoxPVEUserCreateResult';
import type { ProxmoxVMCreateRequest } from '../models/ProxmoxVMCreateRequest';
import type { ProxmoxVMCreateResult } from '../models/ProxmoxVMCreateResult';
import type { ProxmoxVMListResult } from '../models/ProxmoxVMListResult';
import type { ProxmoxVMStartRequest } from '../models/ProxmoxVMStartRequest';
import type { ProxmoxVMStartResult } from '../models/ProxmoxVMStartResult';
import type { ProxmoxVMTemplateRequest } from '../models/ProxmoxVMTemplateRequest';
import type { ProxmoxVMTemplateResult } from '../models/ProxmoxVMTemplateResult';
import type { ProxmoxWorkloadInventoryResult } from '../models/ProxmoxWorkloadInventoryResult';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ProxmoxService {
    /**
     * Create a Proxmox API token over SSH on a Proxmox node.
     * @param body
     * @returns ProxmoxAPITokenCreateResult (empty)
     * @throws ApiError
     */
    public static createProxmoxApiToken(
        body?: ProxmoxAPITokenCreateRequest,
    ): CancelablePromise<ProxmoxAPITokenCreateResult> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/proxmox/api-token',
            body: body,
            errors: {
                400: `Invalid request`,
                401: `Unauthorized`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * List Proxmox LXC containers.
     * @param hostServerId Host server ID for a Proxmox VE node. When supplied, auth and SSH details are resolved automatically for the current user.
     * @param proxmoxSecretId Optional stored Proxmox secret ID to use for this host.
     * @param node Proxmox node name. Optional when host_server_id resolves the node automatically.
     * @param full Whether to include full container info.
     * @returns ProxmoxContainerListResult (empty)
     * @throws ApiError
     */
    public static listProxmoxContainers(
        hostServerId?: string,
        proxmoxSecretId?: string,
        node?: string,
        full?: boolean,
    ): CancelablePromise<ProxmoxContainerListResult> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/proxmox/container',
            query: {
                'host_server_id': hostServerId,
                'proxmox_secret_id': proxmoxSecretId,
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
     * Delete a Proxmox LXC container.
     * @param vmid VMID to delete.
     * @param body Request body.
     * @returns ProxmoxVMStartResult (empty)
     * @throws ApiError
     */
    public static deleteProxmoxContainer(
        vmid: number,
        body?: ProxmoxVMStartRequest,
    ): CancelablePromise<ProxmoxVMStartResult> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/proxmox/container/{vmid}',
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
     * Start a Proxmox LXC container.
     * @param vmid VMID to start.
     * @param body Request body.
     * @returns ProxmoxVMStartResult (empty)
     * @throws ApiError
     */
    public static startProxmoxContainer(
        vmid: number,
        body?: ProxmoxVMStartRequest,
    ): CancelablePromise<ProxmoxVMStartResult> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/proxmox/container/{vmid}/start',
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
     * Stop a Proxmox LXC container.
     * @param vmid VMID to stop.
     * @param body Request body.
     * @returns ProxmoxVMStartResult (empty)
     * @throws ApiError
     */
    public static stopProxmoxContainer(
        vmid: number,
        body?: ProxmoxVMStartRequest,
    ): CancelablePromise<ProxmoxVMStartResult> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/proxmox/container/{vmid}/stop',
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
     * Create a Proxmox LXC container.
     * @param body
     * @returns ProxmoxLXCResult (empty)
     * @throws ApiError
     */
    public static createProxmoxLxc(
        body?: ProxmoxLXCRequest,
    ): CancelablePromise<ProxmoxLXCResult> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/proxmox/lxc',
            body: body,
            errors: {
                400: `Invalid request`,
                401: `Unauthorized`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Create a Proxmox user over SSH on a Proxmox node.
     * @param body
     * @returns ProxmoxPVEUserCreateResult (empty)
     * @throws ApiError
     */
    public static createProxmoxPveUser(
        body?: ProxmoxPVEUserCreateRequest,
    ): CancelablePromise<ProxmoxPVEUserCreateResult> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/proxmox/pve-user',
            body: body,
            errors: {
                400: `Invalid request`,
                401: `Unauthorized`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * List Proxmox QEMU VMs.
     * @param hostServerId Host server ID for a Proxmox VE node. When supplied, auth and SSH details are resolved automatically for the current user.
     * @param proxmoxSecretId Optional stored Proxmox secret ID to use for this host.
     * @param node Proxmox node name. Optional when host_server_id resolves the node automatically.
     * @param full Whether to include full VM info.
     * @returns ProxmoxVMListResult (empty)
     * @throws ApiError
     */
    public static listProxmoxVMs(
        hostServerId?: string,
        proxmoxSecretId?: string,
        node?: string,
        full?: boolean,
    ): CancelablePromise<ProxmoxVMListResult> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/proxmox/vm',
            query: {
                'host_server_id': hostServerId,
                'proxmox_secret_id': proxmoxSecretId,
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
     * Create a Proxmox VM from a template.
     * @param body
     * @returns ProxmoxVMCreateResult (empty)
     * @throws ApiError
     */
    public static createProxmoxVm(
        body?: ProxmoxVMCreateRequest,
    ): CancelablePromise<ProxmoxVMCreateResult> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/proxmox/vm',
            body: body,
            errors: {
                400: `Invalid request`,
                401: `Unauthorized`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Create a Proxmox VM template from a cloud image.
     * @param body
     * @returns ProxmoxVMTemplateResult (empty)
     * @throws ApiError
     */
    public static createProxmoxVmTemplate(
        body?: ProxmoxVMTemplateRequest,
    ): CancelablePromise<ProxmoxVMTemplateResult> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/proxmox/vm/template',
            body: body,
            errors: {
                400: `Invalid request`,
                401: `Unauthorized`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Delete a Proxmox QEMU VM.
     * @param vmid VMID to delete.
     * @param body Request body.
     * @returns ProxmoxVMStartResult (empty)
     * @throws ApiError
     */
    public static deleteProxmoxVm(
        vmid: number,
        body?: ProxmoxVMStartRequest,
    ): CancelablePromise<ProxmoxVMStartResult> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/proxmox/vm/{vmid}',
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
     * Stop a Proxmox QEMU VM.
     * @param vmid VMID to stop.
     * @param body Request body.
     * @returns ProxmoxVMStartResult (empty)
     * @throws ApiError
     */
    public static stopProxmoxVm(
        vmid: number,
        body?: ProxmoxVMStartRequest,
    ): CancelablePromise<ProxmoxVMStartResult> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/proxmox/vm/{vmid}/stop',
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
     * @param hostServerId Host server ID for a Proxmox VE node. When supplied, auth and SSH details are resolved automatically for the current user.
     * @param proxmoxSecretId Optional stored Proxmox secret ID to use for this host.
     * @param node Proxmox node name. Optional when host_server_id resolves the node automatically.
     * @param full Whether to include full workload info.
     * @returns ProxmoxWorkloadInventoryResult (empty)
     * @throws ApiError
     */
    public static listProxmoxWorkloads(
        hostServerId?: string,
        proxmoxSecretId?: string,
        node?: string,
        full?: boolean,
    ): CancelablePromise<ProxmoxWorkloadInventoryResult> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/proxmox/workload',
            query: {
                'host_server_id': hostServerId,
                'proxmox_secret_id': proxmoxSecretId,
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
}
