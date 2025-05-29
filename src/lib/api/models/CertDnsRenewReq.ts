/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Duration } from './Duration';
export type CertDnsRenewReq = {
    acmeEmail?: string;
    acmeUrl?: string;
    domainName?: Array<string>;
    pushS3?: boolean;
    recurseServers?: Array<string>;
    timeout?: Duration;
    token?: string;
    zipDir?: string;
};

