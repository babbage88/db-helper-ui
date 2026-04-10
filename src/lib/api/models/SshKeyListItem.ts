/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UUID } from './UUID';
export type SshKeyListItem = {
    createdAt?: string;
    description?: string;
    id?: UUID;
    keyType?: string;
    lastModified?: string;
    name?: string;
    ownerUserId?: UUID;
    passphraseId?: UUID;
    privateKeyId?: UUID;
    publicKey?: string;
};

