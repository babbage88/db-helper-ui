/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SSHOptions } from './SSHOptions';
export type ProxmoxPVEUserCreateRequest = {
    ssh?: SSHOptions;
    node?: string;
    username?: string;
    realm?: string;
    comment?: string;
    password?: string;
    force?: boolean;
};

