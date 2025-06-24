/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PingHostServerRequest } from '../models/PingHostServerRequest';
import type { PingRequest } from '../models/PingRequest';
import type { PingResponse } from '../models/PingResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class NetworkPingService {
    /**
     * Ping an arbitrary hostname or IP address.
     * @param body
     * @returns PingResponse (empty)
     * @throws ApiError
     */
    public static pingHost(
        body?: PingRequest,
    ): CancelablePromise<PingResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/network/ping',
            body: body,
            errors: {
                400: `Invalid request`,
                401: `Unauthorized`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Ping a managed host server by its ID.
     * @param body
     * @returns PingResponse (empty)
     * @throws ApiError
     */
    public static pingHostServer(
        body?: PingHostServerRequest,
    ): CancelablePromise<PingResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/network/ping-host-server',
            body: body,
            errors: {
                400: `Invalid request`,
                401: `Unauthorized`,
                404: `Host server not found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Ping an arbitrary hostname or IP address using GET method.
     * @param target Target hostname or IP address to ping
     * @returns PingResponse (empty)
     * @throws ApiError
     */
    public static pingHostGet(
        target: string,
    ): CancelablePromise<PingResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/network/ping/{target}',
            path: {
                'target': target,
            },
            errors: {
                400: `Invalid request`,
                401: `Unauthorized`,
                500: `Internal Server Error`,
            },
        });
    }
}
