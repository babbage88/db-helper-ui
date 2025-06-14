/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { HostServerResponse } from '../models/HostServerResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class HostServersService {
    /**
     * Get all host servers.
     * @returns HostServerResponse (empty)
     * @throws ApiError
     */
    public static getAllHostServers(): CancelablePromise<Array<HostServerResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/host-servers',
            errors: {
                401: `Unauthorized`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Create a new host server.
     * @returns HostServerResponse (empty)
     * @throws ApiError
     */
    public static createHostServer(): CancelablePromise<HostServerResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/host-servers/create',
            errors: {
                400: `Invalid request`,
                401: `Unauthorized`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Get a host server by ID.
     * @returns HostServerResponse (empty)
     * @throws ApiError
     */
    public static getHostServer(): CancelablePromise<HostServerResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/host-servers/{ID}',
            errors: {
                400: `Invalid request`,
                401: `Unauthorized`,
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Update a host server.
     * @returns HostServerResponse (empty)
     * @throws ApiError
     */
    public static updateHostServer(): CancelablePromise<HostServerResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/host-servers/{ID}',
            errors: {
                400: `Invalid request`,
                401: `Unauthorized`,
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Delete a host server.
     * @returns any Host server deleted successfully
     * @throws ApiError
     */
    public static deleteHostServer(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/host-servers/{ID}',
            errors: {
                400: `Invalid request`,
                401: `Unauthorized`,
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
}
