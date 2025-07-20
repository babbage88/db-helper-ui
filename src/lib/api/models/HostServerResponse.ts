/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { HostServerType } from './HostServerType';
import type { PlatformType } from './PlatformType';
export type HostServerResponse = {
    created_at?: string;
    host_server_types?: Array<HostServerType>;
    hostname?: string;
    id?: string;
    ip_address?: string;
    last_modified?: string;
    platform_types?: Array<PlatformType>;
    ssh_key_id?: string;
    sudo_password_token_id?: string;
    username?: string;
};

