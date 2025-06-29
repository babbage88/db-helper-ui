/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SshConnectionCloseResponse } from '../models/SshConnectionCloseResponse';
import type { SshConnectionRequestDetails } from '../models/SshConnectionRequestDetails';
import type { SshConnectionResponse } from '../models/SshConnectionResponse';
import type { SshSessionSummary } from '../models/SshSessionSummary';
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
     * @param connid
     * @returns SshConnectionCloseResponse SshConnectionCloseResponse
     * @throws ApiError
     */
    public static closeSshConnection(
        connid: string,
    ): CancelablePromise<SshConnectionCloseResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/ssh/connect/{CONNID}',
            path: {
                'CONNID': connid,
            },
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
     * List all active SSH sessions.
     * @returns SshSessionSummary SshSessionSummary
     * @throws ApiError
     */
    public static listSshSessions(): CancelablePromise<Array<SshSessionSummary>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/ssh/sessions',
            errors: {
                401: `Unauthorized`,
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
            url: '/ssh/websocket/{CONNID}',
            errors: {
                400: `Invalid connection ID`,
                401: `Unauthorized`,
                404: `Session not found`,
            },
        });
    }
}
