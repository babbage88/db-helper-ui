/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SSHOptions } from './SSHOptions';
export type PostgresAppSetupRequest = {
    ssh?: SSHOptions;
    db_name?: string;
    username?: string;
    password?: string;
    schema_name?: string;
    create_db?: boolean;
    drop_first?: boolean;
    postgres_user?: string;
    postgres_password?: string;
    postgres_host?: string;
    postgres_port?: number;
    postgres_conn_db?: string;
    setup_remote_postgres?: boolean;
    remote_postgres_hba_cidr?: string;
    remote_postgres_auth_method?: string;
    remote_postgres_listen_addresses?: string;
};

