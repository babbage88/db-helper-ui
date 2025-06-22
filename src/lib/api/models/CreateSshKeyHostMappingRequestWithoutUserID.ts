/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateSshKeyHostMappingRequestWithoutUserID = {
    /**
     * ID of the host server to map to
     */
    hostServerId: string;
    /**
     * Username to use on the host server
     */
    hostserverUsername: string;
    /**
     * ID of the SSH key to map
     */
    sshKeyId: string;
};

