/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CertDnsRenewReq } from '../models/CertDnsRenewReq';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class CertificatesService {
    /**
     * Request/Renew ssl certificate via cloudflare letsencrypt. Uses DNS Challenge
     * @param body
     * @returns string (empty)
     * @throws ApiError
     */
    public static renew(
        body?: CertDnsRenewReq,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/renew',
            body: body,
            responseHeader: 'cert_pem',
        });
    }
}
