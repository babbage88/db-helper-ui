/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SSHOptions } from './SSHOptions';
export type GarageNodeRequest = {
    admin_api_bind_addr?: string;
    admin_token?: string;
    binary_path?: string;
    config_path?: string;
    data_dir?: string;
    db_engine?: string;
    k2v_api_bind_addr?: string;
    log_level?: string;
    metadata_dir?: string;
    metrics_token?: string;
    replication_factor?: number;
    rpc_bind_addr?: string;
    rpc_public_addr?: string;
    rpc_secret?: string;
    s3_api_bind_addr?: string;
    s3_region?: string;
    s3_root_domain?: string;
    s3_web_bind_addr?: string;
    s3_web_index?: string;
    s3_web_root_domain?: string;
    ssh?: SSHOptions;
    version?: string;
};

