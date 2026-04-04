/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateExternalApplicationRequest } from '../models/CreateExternalApplicationRequest';
import type { ExternalApplicationDao } from '../models/ExternalApplicationDao';
import type { UpdateExternalApplicationRequest } from '../models/UpdateExternalApplicationRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ExternalApplicationsService {
    /**
     * Get all external applications.
     * @returns ExternalApplicationDao
     * @throws ApiError
     */
    public static getAllExternalApplications(): CancelablePromise<Array<ExternalApplicationDao>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/external-applications',
            errors: {
                500: `Internal server error`,
            },
        });
    }
    /**
     * Create a new external application.
     * @param body
     * @returns ExternalApplicationDao
     * @throws ApiError
     */
    public static createExternalApplication(
        body?: CreateExternalApplicationRequest,
    ): CancelablePromise<ExternalApplicationDao> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/external-applications',
            body: body,
            errors: {
                400: `Bad request - invalid input data`,
                409: `Conflict - application with this name already exists`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Get an external application by name.
     * @param name Name of the external application
     * @returns ExternalApplicationDao
     * @throws ApiError
     */
    public static getExternalApplicationByName(
        name: string,
    ): CancelablePromise<ExternalApplicationDao> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/external-applications/by-name/{name}',
            path: {
                'name': name,
            },
            errors: {
                404: `External application not found`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Delete an external application by name.
     * @param name Name of the external application
     * @returns void
     * @throws ApiError
     */
    public static deleteExternalApplicationByName(
        name: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/external-applications/by-name/{name}',
            path: {
                'name': name,
            },
            errors: {
                404: `External application not found`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Get an external application ID by name.
     * @param name Name of the external application
     * @returns any
     * @throws ApiError
     */
    public static getExternalApplicationIdByName(
        name: string,
    ): CancelablePromise<{
        id?: string;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/external-applications/id/{name}',
            path: {
                'name': name,
            },
            errors: {
                404: `External application not found`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Get an external application name by ID.
     * @param id ID of the external application
     * @returns any
     * @throws ApiError
     */
    public static getExternalApplicationNameById(
        id: string,
    ): CancelablePromise<{
        name?: string;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/external-applications/name/{ID}',
            path: {
                'ID': id,
            },
            errors: {
                400: `Bad request - invalid UUID format`,
                404: `External application not found`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Get an external application by ID.
     * @param id ID of the external application
     * @returns ExternalApplicationDao
     * @throws ApiError
     */
    public static getExternalApplicationById(
        id: string,
    ): CancelablePromise<ExternalApplicationDao> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/external-applications/{ID}',
            path: {
                'ID': id,
            },
            errors: {
                400: `Bad request - invalid UUID format`,
                404: `External application not found`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Update an external application.
     * @param id ID of the external application
     * @param body
     * @returns ExternalApplicationDao
     * @throws ApiError
     */
    public static updateExternalApplication(
        id: string,
        body?: UpdateExternalApplicationRequest,
    ): CancelablePromise<ExternalApplicationDao> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/external-applications/{ID}',
            path: {
                'ID': id,
            },
            body: body,
            errors: {
                400: `Bad request - invalid UUID format or request body`,
                404: `External application not found`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Delete an external application by ID.
     * @param id ID of the external application
     * @returns void
     * @throws ApiError
     */
    public static deleteExternalApplicationById(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/external-applications/{ID}',
            path: {
                'ID': id,
            },
            errors: {
                400: `Bad request - invalid UUID format`,
                404: `External application not found`,
                500: `Internal server error`,
            },
        });
    }
}
