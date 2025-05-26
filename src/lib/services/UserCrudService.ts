/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateNewUserRequest } from '../models/CreateNewUserRequest';
import type { DisableUserRequest } from '../models/DisableUserRequest';
import type { EnableDisableUserResponse } from '../models/EnableDisableUserResponse';
import type { EnableUserRequest } from '../models/EnableUserRequest';
import type { SoftDeleteUserByIdRequest } from '../models/SoftDeleteUserByIdRequest';
import type { SoftDeleteUserByIdResponse } from '../models/SoftDeleteUserByIdResponse';
import type { UpdateUserPasswordRequest } from '../models/UpdateUserPasswordRequest';
import type { UpdateUserRoleMappingRequest } from '../models/UpdateUserRoleMappingRequest';
import type { UserDao } from '../models/UserDao';
import type { UserPasswordUpdateResponse } from '../models/UserPasswordUpdateResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class UserCrudService {
    /**
     * Create a new user.
     * @param body
     * @returns UserDao (empty)
     * @throws ApiError
     */
    public static createUser(
        body?: CreateNewUserRequest,
    ): CancelablePromise<UserDao> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/create/user',
            body: body,
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Update user password.
     * @param body
     * @returns UserPasswordUpdateResponse (empty)
     * @throws ApiError
     */
    public static updateUserPw(
        body?: UpdateUserPasswordRequest,
    ): CancelablePromise<UserPasswordUpdateResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/update/userpass',
            body: body,
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Soft Delete User by id.
     * @param body
     * @returns SoftDeleteUserByIdResponse (empty)
     * @throws ApiError
     */
    public static softDeleteUserById(
        body?: SoftDeleteUserByIdRequest,
    ): CancelablePromise<SoftDeleteUserByIdResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/user/delete',
            body: body,
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Disable specified target User Id.
     * @param body
     * @returns EnableDisableUserResponse (empty)
     * @throws ApiError
     */
    public static disableUser(
        body?: DisableUserRequest,
    ): CancelablePromise<EnableDisableUserResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/user/disable',
            body: body,
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Enable specified target User Id.
     * @param body
     * @returns EnableDisableUserResponse (empty)
     * @throws ApiError
     */
    public static enableUser(
        body?: EnableUserRequest,
    ): CancelablePromise<EnableDisableUserResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/user/enable',
            body: body,
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Disable User Role Mapping
     * @param body
     * @returns EnableDisableUserResponse (empty)
     * @throws ApiError
     */
    public static disableUserRoleMapping(
        body?: UpdateUserRoleMappingRequest,
    ): CancelablePromise<EnableDisableUserResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/user/role/remove',
            body: body,
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
}
