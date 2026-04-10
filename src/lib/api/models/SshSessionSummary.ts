/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UUID } from './UUID';
/**
 * SshSessionSummary is a safe summary for listing sessions
 */
export type SshSessionSummary = {
    createdAt?: string;
    hostServerId?: UUID;
    id?: UUID;
    lastActivity?: string;
    userId?: UUID;
    username?: string;
};

