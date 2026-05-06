import type { CancelablePromise } from "@/lib/api/core/CancelablePromise";
import { OpenAPI } from "@/lib/api/core/OpenAPI";
import { request as __request } from "@/lib/api/core/request";

export type DiscoveredInfraDependency = {
  dependencyType: string;
  dependencyName: string;
  config?: Record<string, unknown>;
};

export type DiscoveredUserApplicationCandidate = {
  name: string;
  description?: string;
  repositoryUrl: string;
  manifestPath?: string;
  sourceKind?: string;
  moduleName?: string;
  packageName?: string;
  packageManager?: string;
  deployKind?: string;
  applicationKind?: "go_service" | "frontend_spa";
  registerable?: boolean;
  deployConfig?: Record<string, unknown>;
  buildConfig?: Record<string, unknown>;
  infraDependencies?: DiscoveredInfraDependency[];
};

export type DiscoverUserApplicationResponse = {
  candidates: DiscoveredUserApplicationCandidate[];
};

export class UserApplicationDiscoveryService {
  public static discover(body: {
    repositoryUrl: string;
    branch?: string;
    tag?: string;
  }): CancelablePromise<DiscoverUserApplicationResponse> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/user-applications/discover",
      body,
      errors: {
        400: "Bad request",
        500: "Internal server error",
      },
    });
  }
}
