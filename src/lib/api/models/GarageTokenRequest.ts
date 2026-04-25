/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SSHOptions } from './SSHOptions';
export type GarageTokenRequest = {
    allow_create_buckets?: boolean;
    allow_owner?: boolean;
    allow_read?: boolean;
    allow_write?: boolean;
    binary_path?: string;
    bucket_name?: string;
    config_path?: string;
    create_bucket?: boolean;
    key_name?: string;
    layout_capacity?: string;
    layout_zone?: string;
    s3_endpoint?: string;
    ssh?: SSHOptions;
};

