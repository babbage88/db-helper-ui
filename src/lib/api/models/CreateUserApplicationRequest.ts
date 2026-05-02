/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateInfraDependencyRequest } from './CreateInfraDependencyRequest';
export type CreateUserApplicationRequest = {
    buildConfig?: Record<string, any>;
    deployConfig?: Record<string, any>;
    deployKind?: string;
    description?: string;
    infraDependencies?: Array<CreateInfraDependencyRequest>;
    manifestPath?: string;
    moduleName?: string;
    name?: string;
    packageManager?: string;
    packageName?: string;
    registerable?: boolean;
    repositoryUrl?: string;
    sourceKind?: string;
};

