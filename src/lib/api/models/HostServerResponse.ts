/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Addr } from './Addr';
import type { HostServerType } from './HostServerType';
import type { PlatformType } from './PlatformType';
import type { UUID } from './UUID';
export type HostServerResponse = {
    created_at?: string;
    host_server_types?: Array<HostServerType>;
    hostname?: string;
    id?: UUID;
    ip_address?: Addr;
    last_modified?: string;
    platform_types?: Array<PlatformType>;
    ssh_key_id?: UUID;
    sudo_password_token_id?: UUID;
    username?: string;
};

