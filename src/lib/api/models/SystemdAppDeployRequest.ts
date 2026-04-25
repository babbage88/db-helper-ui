/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SSHOptions } from './SSHOptions';
export type SystemdAppDeployRequest = {
    app_name?: string;
    destination_binary?: string;
    env_vars?: Record<string, string>;
    install_dir?: string;
    service_uid?: number;
    service_user?: string;
    source_bin?: string;
    source_dir?: string;
    source_excludes?: Array<string>;
    source_go_module?: string;
    source_package?: string;
    source_ref?: string;
    source_repo?: string;
    ssh?: SSHOptions;
    systemd_dir?: string;
};

