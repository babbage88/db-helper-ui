/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateUserApplicationRequest } from '../models/CreateUserApplicationRequest';
import type { UpdateUserApplicationRequest } from '../models/UpdateUserApplicationRequest';
import type { UserApplicationDao } from '../models/UserApplicationDao';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class UserApplicationsService {
    /**
     * Get all registered user applications.
     * @returns UserApplicationDao (empty)
     * @throws ApiError
     */
    public static getAllUserApplications(): CancelablePromise<Array<UserApplicationDao>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/user-applications',
            errors: {
                500: `Internal server error`,
            },
        });
    }
    /**
     * Register a deployable user application and its infrastructure dependencies.
     * @param body
     * @returns UserApplicationDao (empty)
     * @throws ApiError
     */
    public static createUserApplication(
        body?: CreateUserApplicationRequest,
    ): CancelablePromise<UserApplicationDao> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/user-applications',
            body: body,
            errors: {
                400: `Bad request - invalid input data`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Get a registered user application by name.
     * @param name
     * @returns UserApplicationDao (empty)
     * @throws ApiError
     */
    public static getUserApplicationByName(
        name: string,
    ): CancelablePromise<UserApplicationDao> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/user-applications/by-name/{name}',
            path: {
                'name': name,
            },
            errors: {
                404: `User application not found`,
            },
        });
    }
    /**
     * Delete a registered user application by name.
     * @param name
     * @returns void
     * @throws ApiError
     */
    public static deleteUserApplicationByName(
        name: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/user-applications/by-name/{name}',
            path: {
                'name': name,
            },
        });
    }
    /**
     * Get a registered user application by ID.
     * @param id
     * @returns UserApplicationDao (empty)
     * @throws ApiError
     */
    public static getUserApplicationById(
        id: string,
    ): CancelablePromise<UserApplicationDao> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/user-applications/{ID}',
            path: {
                'ID': id,
            },
            errors: {
                400: `Bad request - invalid UUID format`,
                404: `User application not found`,
            },
        });
    }
    /**
     * Update a registered user application.
     * @param id
     * @param body
     * @returns UserApplicationDao (empty)
     * @throws ApiError
     */
    public static updateUserApplication(
        id: string,
        body?: UpdateUserApplicationRequest,
    ): CancelablePromise<UserApplicationDao> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/user-applications/{ID}',
            path: {
                'ID': id,
            },
            body: body,
            errors: {
                400: `Bad request - invalid UUID format or request body`,
                404: `User application not found`,
            },
        });
    }
    /**
     * Delete a registered user application by ID.
     * @param id
     * @returns void
     * @throws ApiError
     */
    public static deleteUserApplicationById(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/user-applications/{ID}',
            path: {
                'ID': id,
            },
            errors: {
                400: `Bad request - invalid UUID format`,
            },
        });
    }
}
