/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateSshKeyRequest } from '../models/CreateSshKeyRequest';
import type { CreateSshKeyResponse } from '../models/CreateSshKeyResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SshKeysService {
    /**
     * Create a new SSH key.
     * @param body
     * @returns CreateSshKeyResponse (empty)
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
}
