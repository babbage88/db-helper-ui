/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Addr } from './Addr';
export type UserHostedDb = {
    CreatedAt?: string;
    CurrentHostServerID?: number;
    CurrentKubeClusterID?: number;
    DbPlatformID?: number;
    Fqdn?: string;
    ID?: number;
    LastModified?: string;
    ListenPort?: number;
    PriceTierCodeID?: number;
    PrivateIpAddress?: Addr;
    PubIpAddress?: Addr;
    UserApplicationIds?: Array<number>;
    UserID?: number;
};

