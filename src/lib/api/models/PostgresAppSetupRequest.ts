/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SSHOptions } from './SSHOptions';
export type PostgresAppSetupRequest = {
    create_db?: boolean;
    db_name?: string;
    drop_first?: boolean;
    password?: string;
    postgres_conn_db?: string;
    postgres_host?: string;
    postgres_password?: string;
    postgres_port?: number;
    postgres_user?: string;
    remote_postgres_auth_method?: string;
    remote_postgres_hba_cidr?: string;
    remote_postgres_listen_addresses?: string;
    schema_name?: string;
    setup_remote_postgres?: boolean;
    ssh?: SSHOptions;
    username?: string;
};

