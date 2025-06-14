/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateSshKeyRequest = {
    /**
     * Description of the SSH key
     */
    description?: string;
    /**
     * Optional host server ID to associate the key with
     */
    hostServerId?: string;
    /**
     * Type of the SSH key (e.g., rsa, ed25519)
     */
    keyType: string;
    /**
     * Name of the SSH key
     */
    name: string;
    /**
     * Private key in PEM format
     */
    privateKey: string;
    /**
     * Public key in OpenSSH format
     */
    publicKey: string;
};

