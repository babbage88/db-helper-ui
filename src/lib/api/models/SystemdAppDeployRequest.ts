/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SSHOptions } from './SSHOptions';
export type SystemdAppDeployRequest = {
    ssh?: SSHOptions;
    app_name?: string;
    env_vars?: Record<string, string>;
    service_user?: string;
    service_uid?: number;
    destination_binary?: string;
    install_dir?: string;
    systemd_dir?: string;
    source_dir?: string;
    source_bin?: string;
    source_go_module?: string;
    source_repo?: string;
    source_ref?: string;
    source_package?: string;
    source_excludes?: Array<string>;
};

