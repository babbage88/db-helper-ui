/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CertDnsRenewReq } from '../models/CertDnsRenewReq';
import type { CertificateData } from '../models/CertificateData';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class CertificatesService {
    /**
     * Request/Renew ssl certificate via cloudflare letsencrypt. Uses DNS Challenge
     * @param body
     * @returns CertificateData (empty)
     * @throws ApiError
     */
    public static renew(
        body?: CertDnsRenewReq,
    ): CancelablePromise<CertificateData> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/renew',
            body: body,
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                500: `Insernal Server Error`,
            },
        });
    }
}
