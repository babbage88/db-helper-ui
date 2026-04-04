/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { NetworkProbeResponse } from '../models/NetworkProbeResponse';
import type { ProbeByHostIdRequest } from '../models/ProbeByHostIdRequest';
import type { ProbeByHostnameRequest } from '../models/ProbeByHostnameRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class NetworkProbeService {
    /**
     * Probe a TCP port on a managed host server by its ID.
     * @param body
     * @returns NetworkProbeResponse
     * @throws ApiError
     */
    public static probeTcpByHostId(
        body?: ProbeByHostIdRequest,
    ): CancelablePromise<NetworkProbeResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/network/probe-tcp-host-id',
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
     * Probe a TCP port on a host by hostname.
     * @param body
     * @returns NetworkProbeResponse
     * @throws ApiError
     */
    public static probeTcpByHostname(
        body?: ProbeByHostnameRequest,
    ): CancelablePromise<NetworkProbeResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/network/probe-tcp-hostname',
            body: body,
            errors: {
                400: `Invalid request`,
                401: `Unauthorized`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Probe a TCP port on a host using GET method.
     * @param target Target hostname to probe
     * @param port Port number to probe
     * @returns NetworkProbeResponse
     * @throws ApiError
     */
    public static probeTcpGet(
        target: string,
        port: string,
    ): CancelablePromise<NetworkProbeResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/network/probe-tcp/{target}/{port}',
            path: {
                'target': target,
                'port': port,
            },
            errors: {
                400: `Invalid request`,
                401: `Unauthorized`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Probe a UDP port on a managed host server by its ID.
     * @param body
     * @returns NetworkProbeResponse
     * @throws ApiError
     */
    public static probeUdpByHostId(
        body?: ProbeByHostIdRequest,
    ): CancelablePromise<NetworkProbeResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/network/probe-udp-host-id',
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
     * Probe a UDP port on a host by hostname.
     * @param body
     * @returns NetworkProbeResponse
     * @throws ApiError
     */
    public static probeUdpByHostname(
        body?: ProbeByHostnameRequest,
    ): CancelablePromise<NetworkProbeResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/network/probe-udp-hostname',
            body: body,
            errors: {
                400: `Invalid request`,
                401: `Unauthorized`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Probe a UDP port on a host using GET method.
     * @param target Target hostname to probe
     * @param port Port number to probe
     * @returns NetworkProbeResponse
     * @throws ApiError
     */
    public static probeUdpGet(
        target: string,
        port: string,
    ): CancelablePromise<NetworkProbeResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/network/probe-udp/{target}/{port}',
            path: {
                'target': target,
                'port': port,
            },
            errors: {
                400: `Invalid request`,
                401: `Unauthorized`,
                500: `Internal Server Error`,
            },
        });
    }
}
