/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ProxmoxAPITokenCreateResult = {
    host?: string;
    node?: string;
    host_url?: string;
    userid?: string;
    token_id?: string;
    full_token_id?: string;
    secret?: string;
    api_token?: string;
    role?: string;
    acl_path?: string;
    expires_at_unix?: number;
    privsep?: boolean;
    yolo?: boolean;
    assigned_roles?: Array<string>;
    assigned_privileges?: Array<string>;
    direct_checks?: Array<string>;
    inferred_checks?: Array<string>;
    missing_capabilities?: Array<string>;
};

