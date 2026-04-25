/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SSHOptions } from './SSHOptions';
export type ProxmoxAPITokenCreateRequest = {
    ssh?: SSHOptions;
    node?: string;
    host_url?: string;
    userid?: string;
    username?: string;
    realm?: string;
    token_id?: string;
    comment?: string;
    role?: string;
    acl_path?: string;
    expiration_date?: string;
    days_valid?: number;
    privsep?: boolean;
    force?: boolean;
    yolo?: boolean;
    verify?: boolean;
};

