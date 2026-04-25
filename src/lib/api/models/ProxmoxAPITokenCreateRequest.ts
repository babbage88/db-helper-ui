/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SSHOptions } from './SSHOptions';
import type { UUID } from './UUID';
export type ProxmoxAPITokenCreateRequest = {
    acl_path?: string;
    comment?: string;
    days_valid?: number;
    expiration_date?: string;
    force?: boolean;
    host_server_id?: UUID;
    host_url?: string;
    node?: string;
    privsep?: boolean;
    realm?: string;
    role?: string;
    ssh?: SSHOptions;
    store_as_user_secret?: boolean;
    token_id?: string;
    userid?: string;
    username?: string;
    verify?: boolean;
    yolo?: boolean;
};

