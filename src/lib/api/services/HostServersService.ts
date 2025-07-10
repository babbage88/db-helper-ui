/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateHostServerRequest } from '../models/CreateHostServerRequest';
import type { CreateHostServerTypeMappingRequest } from '../models/CreateHostServerTypeMappingRequest';
import type { CreatePlatformTypeMappingRequest } from '../models/CreatePlatformTypeMappingRequest';
import type { HostServerResponse } from '../models/HostServerResponse';
import type { HostServerType } from '../models/HostServerType';
import type { PlatformType } from '../models/PlatformType';
import type { UpdateHostServerRequest } from '../models/UpdateHostServerRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class HostServersService {
    /**
     * Create a mapping between a host server and a host server type.
     * @param body
     * @returns any (empty)
     * @throws ApiError
     */
    public static createHostServerTypeMapping(
        body?: CreateHostServerTypeMappingRequest,
    ): CancelablePromise<{
        success?: boolean;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/host-server-type-mappings',
            body: body,
            errors: {
                400: `Invalid request`,
                401: `Unauthorized`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Get all available host server types.
     * @returns HostServerType (empty)
     * @throws ApiError
     */
    public static getAllHostServerTypes(): CancelablePromise<Array<HostServerType>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/host-server-types',
            errors: {
                401: `Unauthorized`,
                500: `Internal Server Error`,
            },
        });
    }
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
     * @param body
     * @returns HostServerResponse (empty)
     * @throws ApiError
     */
    public static createHostServer(
        body?: CreateHostServerRequest,
    ): CancelablePromise<HostServerResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/host-servers/create',
            body: body,
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
     * @param id
     * @param body
     * @returns HostServerResponse (empty)
     * @throws ApiError
     */
    public static updateHostServer(
        id: string,
        body?: UpdateHostServerRequest,
    ): CancelablePromise<HostServerResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/host-servers/{ID}',
            path: {
                'ID': id,
            },
            body: body,
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
     * @param id
     * @returns any Host server deleted successfully
     * @throws ApiError
     */
    public static deleteHostServer(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/host-servers/{ID}',
            path: {
                'ID': id,
            },
            errors: {
                400: `Invalid request`,
                401: `Unauthorized`,
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Create a mapping between a host server, platform type, and host server type.
     * @param body
     * @returns any (empty)
     * @throws ApiError
     */
    public static createPlatformTypeMapping(
        body?: CreatePlatformTypeMappingRequest,
    ): CancelablePromise<{
        success?: boolean;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/platform-type-mappings',
            body: body,
            errors: {
                400: `Invalid request`,
                401: `Unauthorized`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Get all available platform types.
     * @returns PlatformType (empty)
     * @throws ApiError
     */
    public static getAllPlatformTypes(): CancelablePromise<Array<PlatformType>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/platform-types',
            errors: {
                401: `Unauthorized`,
                500: `Internal Server Error`,
            },
        });
    }
}
