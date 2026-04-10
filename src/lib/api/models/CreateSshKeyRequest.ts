/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UUID } from './UUID';
export type CreateSshKeyRequest = {
    /**
     * Description of the SSH key
     */
    description?: string;
    hostServerId?: UUID;
    /**
     * Type of the SSH key (e.g., rsa, ed25519)
     */
    keyType: string;
    /**
     * Name of the SSH key
     */
    name: string;
    /**
     * Optional ssh key passphrase
     */
    passphrase?: string;
    /**
     * Private key in PEM format
     */
    privateKey: string;
    /**
     * Public key in OpenSSH format
     */
    publicKey: string;
};

