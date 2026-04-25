/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UUID } from './UUID';
export type ProxmoxAPITokenCreateResult = {
    acl_path?: string;
    api_token?: string;
    assigned_privileges?: Array<string>;
    assigned_roles?: Array<string>;
    direct_checks?: Array<string>;
    expires_at_unix?: number;
    full_token_id?: string;
    host?: string;
    host_url?: string;
    inferred_checks?: Array<string>;
    missing_capabilities?: Array<string>;
    node?: string;
    privsep?: boolean;
    role?: string;
    secret?: string;
    stored_secret_id?: UUID;
    token_id?: string;
    userid?: string;
    yolo?: boolean;
};

