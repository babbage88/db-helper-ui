/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SSHOptions } from './SSHOptions';
export type GarageTokenRequest = {
    ssh?: SSHOptions;
    bucket_name?: string;
    key_name?: string;
    create_bucket?: boolean;
    allow_create_buckets?: boolean;
    allow_read?: boolean;
    allow_write?: boolean;
    allow_owner?: boolean;
    binary_path?: string;
    config_path?: string;
    s3_endpoint?: string;
    layout_zone?: string;
    layout_capacity?: string;
};

