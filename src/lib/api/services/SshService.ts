/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SshConnectionCloseResponse } from '../models/SshConnectionCloseResponse';
import type { SshConnectionRequestDetails } from '../models/SshConnectionRequestDetails';
import type { SshConnectionResponse } from '../models/SshConnectionResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SshService {
    /**
     * Create a new SSH connection to a host server.
     * @param body
     * @returns SshConnectionResponse SshConnectionResponse
     * @throws ApiError
     */
    public static createSshConnection(
        body?: SshConnectionRequestDetails,
    ): CancelablePromise<SshConnectionResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/ssh/connect',
            body: body,
            errors: {
                400: `Invalid request`,
                401: `Unauthorized`,
                403: `Access denied`,
                404: `Host server not found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Close an SSH connection.
     * @returns SshConnectionCloseResponse SshConnectionCloseResponse
     * @throws ApiError
     */
    public static closeSshConnection(): CancelablePromise<SshConnectionCloseResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/ssh/connect/{connectionId}',
            errors: {
                400: `Invalid connection ID`,
                401: `Unauthorized`,
                403: `Access denied`,
                404: `Session not found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * WebSocket endpoint for SSH terminal communication.
     * @returns void
     * @throws ApiError
     */
    public static sshWebSocket(): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/ssh/websocket/{connectionId}',
            errors: {
                400: `Invalid connection ID`,
                401: `Unauthorized`,
                404: `Session not found`,
            },
        });
    }
}
