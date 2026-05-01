/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ProxmoxNodeBridge } from './ProxmoxNodeBridge';
import type { ProxmoxNodeStorage } from './ProxmoxNodeStorage';
import type { ProxmoxStorageContent } from './ProxmoxStorageContent';
export type ProxmoxNodeOptionsResult = {
    bridges?: Array<ProxmoxNodeBridge>;
    iso_images?: Array<ProxmoxStorageContent>;
    node?: string;
    storage?: Array<ProxmoxNodeStorage>;
};

