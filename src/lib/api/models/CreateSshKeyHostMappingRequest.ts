/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UUID } from './UUID';
export type CreateSshKeyHostMappingRequest = {
    hostServerId: UUID;
    /**
     * Username to use on the host server
     */
    hostserverUsername: string;
    sshKeyId: UUID;
    sudoPasswordTokenId?: UUID;
    userId: UUID;
};

