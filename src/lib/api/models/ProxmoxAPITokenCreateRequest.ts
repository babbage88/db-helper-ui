/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UUID } from './UUID';
export type ProxmoxAPITokenCreateRequest = {
    acl_path?: string;
    comment?: string;
    days_valid?: number;
    expiration_date?: string;
    force?: boolean;
    host_server_id?: UUID;
    node?: string;
    privsep?: boolean;
    realm?: string;
    role?: string;
    store_as_user_secret?: boolean;
    token_id?: string;
    userid?: string;
    username?: string;
    verify?: boolean;
    yolo?: boolean;
};

