/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SSHOptions } from './SSHOptions';
import type { UUID } from './UUID';
export type ProxmoxPVEUserCreateRequest = {
    comment?: string;
    force?: boolean;
    host_server_id?: UUID;
    node?: string;
    password?: string;
    realm?: string;
    ssh?: SSHOptions;
    username?: string;
};

