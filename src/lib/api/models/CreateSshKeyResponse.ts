/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UUID } from './UUID';
export type CreateSshKeyResponse = {
    /**
     * Error message if the operation failed
     */
    error?: string;
    passphraseSecretId: UUID;
    privKeySecretId: UUID;
    sshKeyId: UUID;
    userId: UUID;
};

