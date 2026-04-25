/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AccessTokens } from '../models/AccessTokens';
import type { LoginResponseInfo } from '../models/LoginResponseInfo';
import type { TokenRefreshReq } from '../models/TokenRefreshReq';
import type { UserLoginRequest } from '../models/UserLoginRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AuthenticationService {
    /**
     * Local Auth login with username and password.
     * Successful login sets secure HTTP-only auth cookies for subsequent requests.
     * @param body
     * @returns LoginResponseInfo (empty)
     * @throws ApiError
     */
    public static localLogin(
        body?: UserLoginRequest,
    ): CancelablePromise<LoginResponseInfo> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/login',
            body: body,
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                500: `Insernal Server Error`,
            },
        });
    }
    /**
     * Refresh accessTokens and return to client.
     * When a refresh cookie is present, the request body token is optional.
     * @param body
     * @returns AccessTokens (empty)
     * @throws ApiError
     */
    public static refreshAccessToken(
        body?: TokenRefreshReq,
    ): CancelablePromise<AccessTokens> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/token/refresh',
            body: body,
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                500: `Insernal Server Error`,
            },
        });
    }
    /**
     * Verify the current access token's validity.
     * The token may be supplied by the secure auth cookie or the Authorization header.
     * @returns any Valid Token
     * @throws ApiError
     */
    public static verifyToken(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/token/verify',
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
            },
        });
    }
}
