/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateSshKeyHostMappingRequestWithoutUserID } from '../models/CreateSshKeyHostMappingRequestWithoutUserID';
import type { CreateSshKeyHostMappingResponse } from '../models/CreateSshKeyHostMappingResponse';
import type { DeleteSshKeyHostMappingResponse } from '../models/DeleteSshKeyHostMappingResponse';
import type { UpdateSshKeyHostMappingRequest } from '../models/UpdateSshKeyHostMappingRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SshKeyHostMappingsService {
    /**
     * Create a new SSH key host mapping.
     * @param body
     * @returns CreateSshKeyHostMappingResponse (empty)
     * @throws ApiError
     */
    public static createSshKeyHostMapping(
        body?: CreateSshKeyHostMappingRequestWithoutUserID,
    ): CancelablePromise<CreateSshKeyHostMappingResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/ssh-key-host-mappings/create',
            body: body,
            errors: {
                400: `Invalid request`,
                401: `Unauthorized`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Get all SSH key host mappings for a host server.
     * @param hostId ID of the host server to get mappings for
     * @returns CreateSshKeyHostMappingResponse (empty)
     * @throws ApiError
     */
    public static getSshKeyHostMappingsByHostId(
        hostId: string,
    ): CancelablePromise<Array<CreateSshKeyHostMappingResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/ssh-key-host-mappings/host/{hostId}',
            path: {
                'hostId': hostId,
            },
            errors: {
                400: `Invalid request`,
                401: `Unauthorized`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Get all SSH key host mappings for an SSH key.
     * @param keyId ID of the SSH key to get mappings for
     * @returns CreateSshKeyHostMappingResponse (empty)
     * @throws ApiError
     */
    public static getSshKeyHostMappingsByKeyId(
        keyId: string,
    ): CancelablePromise<Array<CreateSshKeyHostMappingResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/ssh-key-host-mappings/key/{keyId}',
            path: {
                'keyId': keyId,
            },
            errors: {
                400: `Invalid request`,
                401: `Unauthorized`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Get all SSH key host mappings for a user.
     * @param userId ID of the user to get mappings for
     * @returns CreateSshKeyHostMappingResponse (empty)
     * @throws ApiError
     */
    public static getSshKeyHostMappingsByUserId(
        userId: string,
    ): CancelablePromise<Array<CreateSshKeyHostMappingResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/ssh-key-host-mappings/user/{userId}',
            path: {
                'userId': userId,
            },
            errors: {
                400: `Invalid request`,
                401: `Unauthorized`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Get an SSH key host mapping by ID.
     * @param id ID of the SSH key host mapping to retrieve
     * @returns CreateSshKeyHostMappingResponse (empty)
     * @throws ApiError
     */
    public static getSshKeyHostMappingById(
        id: string,
    ): CancelablePromise<CreateSshKeyHostMappingResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/ssh-key-host-mappings/{id}',
            path: {
                'id': id,
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
     * Update an SSH key host mapping.
     * @param id ID of the SSH key host mapping to update
     * @param body
     * @returns CreateSshKeyHostMappingResponse (empty)
     * @throws ApiError
     */
    public static updateSshKeyHostMapping(
        id: string,
        body?: UpdateSshKeyHostMappingRequest,
    ): CancelablePromise<CreateSshKeyHostMappingResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/ssh-key-host-mappings/{id}',
            path: {
                'id': id,
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
     * Delete an SSH key host mapping.
     * @param id ID of the SSH key host mapping to delete
     * @returns DeleteSshKeyHostMappingResponse (empty)
     * @throws ApiError
     */
    public static deleteSshKeyHostMapping(
        id: string,
    ): CancelablePromise<DeleteSshKeyHostMappingResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/ssh-key-host-mappings/{id}',
            path: {
                'id': id,
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
