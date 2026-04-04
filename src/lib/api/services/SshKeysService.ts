/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateSshKeyRequest } from '../models/CreateSshKeyRequest';
import type { CreateSshKeyResponse } from '../models/CreateSshKeyResponse';
import type { SshKeyListItem } from '../models/SshKeyListItem';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SshKeysService {
    /**
     * Create a new SSH key.
     * @param body
     * @returns CreateSshKeyResponse
     * @throws ApiError
     */
    public static createSshKey(
        body?: CreateSshKeyRequest,
    ): CancelablePromise<CreateSshKeyResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/ssh-keys/create',
            body: body,
            errors: {
                400: `Invalid request`,
                401: `Unauthorized`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Get all SSH keys owned by a user.
     * @param userId ID of the user to get SSH keys for
     * @returns SshKeyListItem
     * @throws ApiError
     */
    public static getSshKeysByUserId(
        userId: string,
    ): CancelablePromise<Array<SshKeyListItem>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/ssh-keys/user/{userId}',
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
     * Delete an SSH key and its associated secret.
     * @param id ID of the SSH key to delete
     * @returns any
     * @throws ApiError
     */
    public static deleteSshKey(
        id: string,
    ): CancelablePromise<{
        /**
         * Success message
         */
        message?: string;
    }> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/ssh-keys/{id}',
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
