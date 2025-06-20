/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateSshKeyHostMappingResponse = {
    /**
     * Creation timestamp
     */
    createdAt: string;
    /**
     * Error message if the operation failed
     */
    error?: string;
    /**
     * ID of the host server
     */
    hostServerId: string;
    /**
     * Username on the host server
     */
    hostserverUsername: string;
    /**
     * ID of the created mapping
     */
    id: string;
    /**
     * Last modification timestamp
     */
    lastModified: string;
    /**
     * ID of the SSH key
     */
    sshKeyId: string;
    /**
     * ID of the user
     */
    userId: string;
};

