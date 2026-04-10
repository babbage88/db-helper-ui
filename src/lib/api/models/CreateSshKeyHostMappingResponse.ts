/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UUID } from './UUID';
export type CreateSshKeyHostMappingResponse = {
    /**
     * Creation timestamp
     */
    createdAt: string;
    /**
     * Error message if the operation failed
     */
    error?: string;
    hostServerId: UUID;
    /**
     * Username on the host server
     */
    hostserverUsername: string;
    id: UUID;
    /**
     * Last modification timestamp
     */
    lastModified: string;
    sshKeyId: UUID;
    userId: UUID;
};

