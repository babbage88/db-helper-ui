/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { InfraDependencyDao } from './InfraDependencyDao';
import type { UUID } from './UUID';
export type UserApplicationDao = {
    buildConfig?: Record<string, any>;
    createdAt?: string;
    deployConfig?: Record<string, any>;
    deployKind?: string;
    description?: string;
    id?: UUID;
    infraDependencies?: Array<InfraDependencyDao>;
    lastModified?: string;
    manifestPath?: string;
    moduleName?: string;
    name?: string;
    packageManager?: string;
    packageName?: string;
    registerable?: boolean;
    repositoryUrl?: string;
    sourceKind?: string;
};

