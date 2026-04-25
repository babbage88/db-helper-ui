/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateHostServerRequest } from '../models/CreateHostServerRequest';
import type { CreateHostServerTypeBodyRequest } from '../models/CreateHostServerTypeBodyRequest';
import type { CreateHostServerTypeMappingRequest } from '../models/CreateHostServerTypeMappingRequest';
import type { CreatePlatformTypeBodyRequest } from '../models/CreatePlatformTypeBodyRequest';
import type { CreatePlatformTypeMappingRequest } from '../models/CreatePlatformTypeMappingRequest';
import type { HostServerIDResponse } from '../models/HostServerIDResponse';
import type { HostServerResponse } from '../models/HostServerResponse';
import type { HostServerType } from '../models/HostServerType';
import type { PlatformType } from '../models/PlatformType';
import type { UpdateHostServerRequest } from '../models/UpdateHostServerRequest';
import type { UpdateHostServerTypeBody } from '../models/UpdateHostServerTypeBody';
import type { UpdatePlatformTypeBody } from '../models/UpdatePlatformTypeBody';
import type { UUID } from '../models/UUID';
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
     * Create a new host server type (CRUD endpoint)
     * @returns HostServerType (empty)
     * @throws ApiError
     */
    public static createHostServerTypeBody(): CancelablePromise<HostServerType> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/host-server-types',
            errors: {
                400: `Invalid request`,
                401: `Unauthorized`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Get a host server type by name
     * @param name
     * @returns HostServerType (empty)
     * @throws ApiError
     */
    public static getHostServerTypeByName(
        name: string,
    ): CancelablePromise<HostServerType> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/host-server-types/by-name/{name}',
            path: {
                'name': name,
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
     * Get a host server type by ID
     * @param id Host server type ID
     * @returns HostServerType (empty)
     * @throws ApiError
     */
    public static getHostServerTypeById(
        id: string,
    ): CancelablePromise<HostServerType> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/host-server-types/{ID}',
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
     * Update a host server type
     * @param id Host server type ID
     * @param body
     * @returns HostServerType (empty)
     * @throws ApiError
     */
    public static updateHostServerType(
        id: string,
        body?: UpdateHostServerTypeBody,
    ): CancelablePromise<HostServerType> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/host-server-types/{ID}',
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
     * Delete a host server type
     * @param id Host server type ID
     * @returns any Host server type deleted successfully
     * @throws ApiError
     */
    public static deleteHostServerType(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/host-server-types/{ID}',
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
     * Get a host server UUID by hostname.
     * @param hostname Host server hostname
     * @returns HostServerIDResponse (empty)
     * @throws ApiError
     */
    public static getHostServerIdByHostname(
        hostname: string,
    ): CancelablePromise<HostServerIDResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/host-servers/by-hostname/{hostname}/id',
            path: {
                'hostname': hostname,
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
     * @param id Host server ID
     * @returns HostServerResponse (empty)
     * @throws ApiError
     */
    public static getHostServer(
        id: string,
    ): CancelablePromise<HostServerResponse> {
        return __request(OpenAPI, {
            method: 'GET',
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
     * Update a host server.
     * @param id Host server ID
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
     * @param id Host server ID
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
     * Create a new HostServerType with the specified NAME
     * @param body
     * @returns any (empty)
     * @throws ApiError
     */
    public static createHostServerType(
        body?: CreateHostServerTypeBodyRequest,
    ): CancelablePromise<{
        hostServerId?: UUID;
        name?: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/host-servers/{NAME}',
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
    /**
     * Create a new platform type (CRUD endpoint)
     * @param body
     * @returns PlatformType (empty)
     * @throws ApiError
     */
    public static createPlatformTypeBody(
        body?: CreatePlatformTypeBodyRequest,
    ): CancelablePromise<PlatformType> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/platform-types',
            body: body,
            errors: {
                400: `Invalid request`,
                401: `Unauthorized`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Get a platform type by name
     * @param name
     * @returns PlatformType (empty)
     * @throws ApiError
     */
    public static getPlatformTypeByName(
        name: string,
    ): CancelablePromise<PlatformType> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/platform-types/by-name/{name}',
            path: {
                'name': name,
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
     * Get a platform type by ID
     * @param id Platform type ID
     * @returns PlatformType (empty)
     * @throws ApiError
     */
    public static getPlatformTypeById(
        id: string,
    ): CancelablePromise<PlatformType> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/platform-types/{ID}',
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
     * Update a platform type
     * @param id Platform type ID
     * @param body
     * @returns PlatformType (empty)
     * @throws ApiError
     */
    public static updatePlatformType(
        id: string,
        body?: UpdatePlatformTypeBody,
    ): CancelablePromise<PlatformType> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/platform-types/{ID}',
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
     * Delete a platform type
     * @param id Platform type ID
     * @returns any Platform type deleted successfully
     * @throws ApiError
     */
    public static deletePlatformType(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/platform-types/{ID}',
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
}
