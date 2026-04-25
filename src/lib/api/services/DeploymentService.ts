/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { GarageNodeRequest } from '../models/GarageNodeRequest';
import type { GarageNodeResult } from '../models/GarageNodeResult';
import type { GarageTokenRequest } from '../models/GarageTokenRequest';
import type { GarageTokenResult } from '../models/GarageTokenResult';
import type { MariaDBInstallRequest } from '../models/MariaDBInstallRequest';
import type { MariaDBInstallResult } from '../models/MariaDBInstallResult';
import type { PostgresAppSetupRequest } from '../models/PostgresAppSetupRequest';
import type { PostgresAppSetupResult } from '../models/PostgresAppSetupResult';
import type { ProxyInstallRequest } from '../models/ProxyInstallRequest';
import type { ProxyInstallResult } from '../models/ProxyInstallResult';
import type { SystemdAppDeployRequest } from '../models/SystemdAppDeployRequest';
import type { SystemdAppDeployResult } from '../models/SystemdAppDeployResult';
import type { ValkeyInstallRequest } from '../models/ValkeyInstallRequest';
import type { ValkeyInstallResult } from '../models/ValkeyInstallResult';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DeploymentService {
    /**
     * Install and configure MariaDB for remote access.
     * @param body
     * @returns MariaDBInstallResult (empty)
     * @throws ApiError
     */
    public static installMariaDb(
        body?: MariaDBInstallRequest,
    ): CancelablePromise<MariaDBInstallResult> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/database/mariadb/install',
            body: body,
            errors: {
                400: `Invalid request`,
                401: `Unauthorized`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Create or update a PostgreSQL application database and role over SSH.
     * @param body
     * @returns PostgresAppSetupResult (empty)
     * @throws ApiError
     */
    public static setupPostgresApp(
        body?: PostgresAppSetupRequest,
    ): CancelablePromise<PostgresAppSetupResult> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/database/postgres/app',
            body: body,
            errors: {
                400: `Invalid request`,
                401: `Unauthorized`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Install and configure Valkey for remote access.
     * @param body
     * @returns ValkeyInstallResult (empty)
     * @throws ApiError
     */
    public static installValkey(
        body?: ValkeyInstallRequest,
    ): CancelablePromise<ValkeyInstallResult> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/database/valkey/install',
            body: body,
            errors: {
                400: `Invalid request`,
                401: `Unauthorized`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Build or upload and deploy an application as a remote systemd service.
     * @param body
     * @returns SystemdAppDeployResult (empty)
     * @throws ApiError
     */
    public static deploySystemdApp(
        body?: SystemdAppDeployRequest,
    ): CancelablePromise<SystemdAppDeployResult> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/deploy/systemd-app',
            body: body,
            errors: {
                400: `Invalid request`,
                401: `Unauthorized`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Install and configure a supported proxy on a remote host over SSH.
     * @param name Proxy name to install.
     * @param body
     * @returns ProxyInstallResult (empty)
     * @throws ApiError
     */
    public static installProxy(
        name: string,
        body?: ProxyInstallRequest,
    ): CancelablePromise<ProxyInstallResult> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/proxy/{name}/install',
            path: {
                'name': name,
            },
            body: body,
            errors: {
                400: `Invalid request`,
                401: `Unauthorized`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Install and configure a Garage S3 node on a remote host.
     * @param body
     * @returns GarageNodeResult (empty)
     * @throws ApiError
     */
    public static deployGarageNode(
        body?: GarageNodeRequest,
    ): CancelablePromise<GarageNodeResult> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/storage/s3/garage/node',
            body: body,
            errors: {
                400: `Invalid request`,
                401: `Unauthorized`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Create Garage S3 credentials on a remote host.
     * @param body
     * @returns GarageTokenResult (empty)
     * @throws ApiError
     */
    public static createGarageToken(
        body?: GarageTokenRequest,
    ): CancelablePromise<GarageTokenResult> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/storage/s3/garage/token',
            body: body,
            errors: {
                400: `Invalid request`,
                401: `Unauthorized`,
                500: `Internal Server Error`,
            },
        });
    }
}
