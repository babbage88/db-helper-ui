/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export interface SshConnectionRequest {
  hostServerId: string;
  username: string;
}

export interface SshConnectionResponse {
  connectionId: string;
  websocketUrl: string;
  success: boolean;
  error?: string;
}

export class SshConnectionService {
  /**
   * Create a new SSH connection to a host server.
   * @param body
   * @returns SshConnectionResponse
   * @throws ApiError
   */
  public static createSshConnection(
    body?: SshConnectionRequest,
  ): CancelablePromise<SshConnectionResponse> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/ssh/connect',
      body: body,
      errors: {
        400: `Invalid request`,
        401: `Unauthorized`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Close an SSH connection.
   * @param connectionId ID of the connection to close
   * @returns any
   * @throws ApiError
   */
  public static closeSshConnection(
    connectionId: string,
  ): CancelablePromise<{
    message?: string;
  }> {
    return __request(OpenAPI, {
      method: 'DELETE',
      url: '/ssh/connect/{connectionId}',
      path: {
        'connectionId': connectionId,
      },
      errors: {
        400: `Invalid request`,
        401: `Unauthorized`,
        404: `Connection not found`,
        500: `Internal Server Error`,
      },
    });
  }
} 