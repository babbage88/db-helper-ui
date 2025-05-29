/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { GetUserByIdResponse } from '../models/GetUserByIdResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class UsersService {
    /**
     * Returns all active users.
     * @returns string (empty)
     * @throws ApiError
     */
    public static getAllUsers(): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/users',
            responseHeader: 'users',
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Returns User Info for the user id specified in URL users.
     * @param id ID of user
     * @returns GetUserByIdResponse (empty)
     * @throws ApiError
     */
    public static getUserById(
        id: string,
    ): CancelablePromise<GetUserByIdResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/users/{ID}',
            path: {
                'ID': id,
            },
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
}
