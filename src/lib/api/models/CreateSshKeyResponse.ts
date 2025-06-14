/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateSshKeyResponse = {
    /**
     * Error message if the operation failed
     */
    error?: string;
    /**
     * ID of the stored private key secret
     */
    privKeySecretId: string;
    /**
     * ID of the created SSH key
     */
    sshKeyId: string;
    /**
     * ID of the user who owns the key
     */
    userId: string;
};

