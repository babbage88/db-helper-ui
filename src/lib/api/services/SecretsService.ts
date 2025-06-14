/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateSecretRequest } from '../models/CreateSecretRequest';
import type { UserSecretEntry } from '../models/UserSecretEntry';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SecretsService {
    /**
     * Create a new external application secret.
     * @param body
     * @returns any Secret stored successfully
     * @throws ApiError
     */
    public static createUserSecret(
        body?: CreateSecretRequest,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/secrets/create',
            body: body,
            errors: {
                400: `Invalid request`,
                401: `Unauthorized`,
            },
        });
    }
    /**
     * Delete a user secret by ID.
     * @param id
     * @returns any Secret deleted successfully
     * @throws ApiError
     */
    public static deleteUserSecretById(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/secrets/delete/{ID}',
            path: {
                'ID': id,
            },
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
            },
        });
    }
    /**
     * Retrieve a user secret by ID.
     * @param id ID of secret
     * @returns any (empty)
     * @throws ApiError
     */
    public static getUserSecretById(
        id: string,
    ): CancelablePromise<{
        expiration?: string;
        external_application_id?: string;
        id?: string;
        secret?: string;
        user_id?: string;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/secrets/{ID}',
            path: {
                'ID': id,
            },
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
            },
        });
    }
    /**
     * Retrieve a user secret by USERID.
     * @param userid
     * @returns UserSecretEntry (empty)
     * @throws ApiError
     */
    public static getUserSecretEntries(
        userid: string,
    ): CancelablePromise<Array<UserSecretEntry>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/user/secrets/{USERID}',
            path: {
                'USERID': userid,
            },
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
            },
        });
    }
    /**
     * Retrieve a user secret by USERID.
     * @param userid
     * @param appid
     * @returns UserSecretEntry (empty)
     * @throws ApiError
     */
    public static getUserSecretEntriesByAppId(
        userid: string,
        appid: string,
    ): CancelablePromise<Array<UserSecretEntry>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/user/{APPID}/secrets/{USERID}',
            path: {
                'USERID': userid,
                'APPID': appid,
            },
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
            },
        });
    }
}
