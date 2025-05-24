/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UserLoginRequest } from '../models/UserLoginRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AuthenticationService {
    /**
     * Login a user and return token.
     * @param body
     * @returns string Respose will return login result and the user info.
     * @throws ApiError
     */
    public static localLogin(
        body?: UserLoginRequest,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/login',
            body: body,
            responseHeader: 'expiration',
        });
    }
    /**
     * Refresh accessTokens andreturn to client.
     * @returns string Respose will return login result and the user info.
     * @throws ApiError
     */
    public static refreshAccessToken(): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/token/refresh',
            responseHeader: 'expiration',
        });
    }
}
