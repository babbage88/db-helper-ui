"use client";

import * as React from "react";
import { Boxes, Plus, RefreshCw, Rocket, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import type { CreateInfraDependencyRequest } from "@/lib/api/models/CreateInfraDependencyRequest";
import type { CreateUserApplicationRequest } from "@/lib/api/models/CreateUserApplicationRequest";
import type { HostServerType } from "@/lib/api/models/HostServerType";
import type { PlatformType } from "@/lib/api/models/PlatformType";
import type { UserApplicationDao } from "@/lib/api/models/UserApplicationDao";
import { HostServersService } from "@/lib/api/services/HostServersService";
import { UserApplicationsService } from "@/lib/api/services/UserApplicationsService";
import {
  showErrorToast,
  showInfoToast,
  showSuccessToast,
} from "@/lib/toast-utils";

type DependencyDraft = {
  key: string;
  dependencyType: "host_server_type" | "platform_type";
  selectedId: string;
};

const DOGFOOD_APPLICATIONS: Array<{
  label: string;
  payload: CreateUserApplicationRequest;
}> = [
  {
    label: "Register infractl-ui",
    payload: {
      name: "infractl-ui",
      description: "The infractl React frontend delivered as a static site behind nginx.",
      repositoryUrl: "https://github.com/babbage88/infractl-ui",
      manifestPath: "package.json",
      sourceKind: "package.json",
      packageName: "infractl-ui",
      packageManager: "npm",
      deployKind: "nginx_static_site",
      registerable: true,
      buildConfig: {
        installCommand: "npm ci",
        buildCommand: "npm run build-rockydev2",
      },
      deployConfig: {
        artifactPath: "builds/dev",
        webRoot: "/usr/share/nginx/html/infractl",
        webServer: "nginx",
      },
      infraDependencies: [
        { dependencyType: "host_server_type", dependencyName: "Application Server" },
        { dependencyType: "platform_type", dependencyName: "Nginx Server" },
        { dependencyType: "platform_type", dependencyName: "Linux VPS" },
      ],
    },
  },
  {
    label: "Register go-infra",
    payload: {
      name: "go-infra",
      description: "The infractl API service deployed as a remote systemd workload.",
      repositoryUrl: "https://github.com/babbage88/go-infra",
      manifestPath: "go.mod",
      sourceKind: "go.mod",
      moduleName: "github.com/babbage88/go-infra",
      packageManager: "go",
      deployKind: "systemd_service",
      registerable: true,
      buildConfig: {
        buildCommand: "go build -o dist/goinfra .",
        entryPackage: ".",
      },
      deployConfig: {
        appName: "go-infra",
        destinationBinary: "goinfra",
        installDir: "/etc/go-infra",
        systemdUnit: "go-infra.service",
      },
      infraDependencies: [
        { dependencyType: "host_server_type", dependencyName: "Application Server" },
        { dependencyType: "platform_type", dependencyName: "Linux VPS" },
        { dependencyType: "platform_type", dependencyName: "Linux VM" },
        { dependencyType: "platform_type", dependencyName: "Postgres SQL" },
        { dependencyType: "platform_type", dependencyName: "Valkey" },
        { dependencyType: "platform_type", dependencyName: "Garage S3" },
      ],
    },
  },
];

function parseErrorMessage(error: unknown) {
  if (typeof error === "object" && error !== null) {
    const candidate = error as { body?: unknown; message?: unknown };
    if (typeof candidate.body === "string" && candidate.body) return candidate.body;
    if (typeof candidate.message === "string" && candidate.message) return candidate.message;
  }
  return "Request failed.";
}

function createDependencyDraft(): DependencyDraft {
  return {
    key: crypto.randomUUID(),
    dependencyType: "platform_type",
    selectedId: "",
  };
}

export default function ManageUserApplicationsPage() {
  const [applications, setApplications] = React.useState<UserApplicationDao[]>([]);
  const [hostServerTypes, setHostServerTypes] = React.useState<HostServerType[]>([]);
  const [platformTypes, setPlatformTypes] = React.useState<PlatformType[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [isSubmittingPreset, setIsSubmittingPreset] = React.useState<string | null>(null);

  const loadPageData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [apps, hostTypes, platforms] = await Promise.all([
        UserApplicationsService.getAllUserApplications(),
        HostServersService.getAllHostServerTypes(),
        HostServersService.getAllPlatformTypes(),
      ]);
      setApplications(apps || []);
      setHostServerTypes(hostTypes || []);
      setPlatformTypes(platforms || []);
    } catch (error) {
      console.error("Failed to load user applications page:", error);
      showErrorToast("Failed to load user applications", parseErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadPageData();
  }, [loadPageData]);

  async function handleRegisterPreset(payload: CreateUserApplicationRequest) {
    const label = payload.name || "application";
    setIsSubmittingPreset(label);
    try {
      await UserApplicationsService.createUserApplication(payload);
      showSuccessToast(`Registered ${label}`, "The application is now tracked by infractl.");
      await loadPageData();
    } catch (error) {
      console.error(`Failed to register ${label}:`, error);
      showErrorToast(`Failed to register ${label}`, parseErrorMessage(error));
    } finally {
      setIsSubmittingPreset(null);
    }
  }

  async function handleDelete(application: UserApplicationDao) {
    if (!application.id || !application.name) return;
    try {
      await UserApplicationsService.deleteUserApplicationById(application.id);
      showInfoToast(`Deleted ${application.name}`);
      await loadPageData();
    } catch (error) {
      console.error(`Failed to delete ${application.name}:`, error);
      showErrorToast(`Failed to delete ${application.name}`, parseErrorMessage(error));
    }
  }

  return (
    <div className="container mx-auto py-10">
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Boxes className="h-5 w-5" />
                  User Applications
                </CardTitle>
                <CardDescription>
                  Register deployable repositories and map them to the host and platform
                  capabilities infractl should target.
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => loadPageData()}>
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Register Manually
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {DOGFOOD_APPLICATIONS.map((dogfoodApp) => (
              <Card key={dogfoodApp.label} className="border-dashed">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{dogfoodApp.payload.name}</CardTitle>
                  <CardDescription>{dogfoodApp.payload.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-3 pt-0">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{dogfoodApp.payload.deployKind}</Badge>
                    {(dogfoodApp.payload.infraDependencies || []).slice(0, 3).map((dependency) => (
                      <Badge key={`${dogfoodApp.payload.name}-${dependency.dependencyType}-${dependency.dependencyName}`} variant="outline">
                        {dependency.dependencyName}
                      </Badge>
                    ))}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleRegisterPreset(dogfoodApp.payload)}
                    disabled={isSubmittingPreset === dogfoodApp.payload.name}
                  >
                    <Rocket className="h-4 w-4" />
                    {isSubmittingPreset === dogfoodApp.payload.name ? "Registering..." : "Register"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Registered Applications</CardTitle>
            <CardDescription>
              Current application manifests and dependency mappings stored in infractl.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-sm text-muted-foreground">Loading applications...</div>
            ) : applications.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                No user applications have been registered yet.
              </div>
            ) : (
              <div className="grid gap-4">
                {applications.map((application) => (
                  <Card key={application.id || application.name}>
                    <CardHeader>
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{application.name}</CardTitle>
                          <CardDescription>{application.description || application.repositoryUrl}</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge>{application.deployKind || "unknown"}</Badge>
                          <Badge variant="outline">{application.sourceKind || "manual"}</Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(application)}
                            aria-label={`Delete ${application.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="grid gap-4 text-sm">
                      <div className="grid gap-1">
                        <div className="font-medium">Repository</div>
                        <div className="break-all text-muted-foreground">{application.repositoryUrl}</div>
                      </div>
                      <div className="grid gap-1 md:grid-cols-2 md:gap-4">
                        <div>
                          <div className="font-medium">Manifest</div>
                          <div className="text-muted-foreground">{application.manifestPath || "Not specified"}</div>
                        </div>
                        <div>
                          <div className="font-medium">Package / Module</div>
                          <div className="text-muted-foreground">
                            {application.packageName || application.moduleName || "Not specified"}
                          </div>
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <div className="font-medium">Infra Dependencies</div>
                        <div className="flex flex-wrap gap-2">
                          {(application.infraDependencies || []).length > 0 ? (
                            application.infraDependencies?.map((dependency) => (
                              <Badge
                                key={`${application.id}-${dependency.id}-${dependency.dependencyType}-${dependency.dependencyName}`}
                                variant="secondary"
                              >
                                {dependency.dependencyName}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground">No dependencies recorded.</span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <CreateUserApplicationDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        hostServerTypes={hostServerTypes}
        platformTypes={platformTypes}
        onCreated={loadPageData}
      />
    </div>
  );
}

function CreateUserApplicationDialog({
  open,
  onOpenChange,
  hostServerTypes,
  platformTypes,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hostServerTypes: HostServerType[];
  platformTypes: PlatformType[];
  onCreated: () => Promise<void>;
}) {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [repositoryUrl, setRepositoryUrl] = React.useState("");
  const [manifestPath, setManifestPath] = React.useState("");
  const [sourceKind, setSourceKind] = React.useState("manual");
  const [deployKind, setDeployKind] = React.useState("systemd_service");
  const [packageManager, setPackageManager] = React.useState("");
  const [packageName, setPackageName] = React.useState("");
  const [moduleName, setModuleName] = React.useState("");
  const [buildConfigJson, setBuildConfigJson] = React.useState("{}");
  const [deployConfigJson, setDeployConfigJson] = React.useState("{}");
  const [dependencies, setDependencies] = React.useState<DependencyDraft[]>([createDependencyDraft()]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setName("");
      setDescription("");
      setRepositoryUrl("");
      setManifestPath("");
      setSourceKind("manual");
      setDeployKind("systemd_service");
      setPackageManager("");
      setPackageName("");
      setModuleName("");
      setBuildConfigJson("{}");
      setDeployConfigJson("{}");
      setDependencies([createDependencyDraft()]);
      setIsSubmitting(false);
    }
  }, [open]);

  function getDependencyOptions(type: DependencyDraft["dependencyType"]) {
    return type === "host_server_type" ? hostServerTypes : platformTypes;
  }

  function parseJsonConfig(value: string) {
    if (!value.trim()) return undefined;
    return JSON.parse(value) as Record<string, unknown>;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const infraDependencies: CreateInfraDependencyRequest[] = dependencies
        .filter((dependency) => dependency.selectedId)
        .map((dependency) => {
          const options = getDependencyOptions(dependency.dependencyType);
          const selected = options.find((option) => option.id === dependency.selectedId);
          return {
            dependencyType: dependency.dependencyType,
            dependencyName: selected?.name || dependency.selectedId,
            hostServerTypeId: dependency.dependencyType === "host_server_type" ? dependency.selectedId : undefined,
            platformTypeId: dependency.dependencyType === "platform_type" ? dependency.selectedId : undefined,
          };
        });

      const payload: CreateUserApplicationRequest = {
        name,
        description,
        repositoryUrl,
        manifestPath,
        sourceKind,
        deployKind,
        packageManager,
        packageName,
        moduleName,
        registerable: true,
        buildConfig: parseJsonConfig(buildConfigJson),
        deployConfig: parseJsonConfig(deployConfigJson),
        infraDependencies,
      };

      await UserApplicationsService.createUserApplication(payload);
      showSuccessToast(`Registered ${name}`, "The application was added to infractl.");
      onOpenChange(false);
      await onCreated();
    } catch (error) {
      console.error("Failed to create user application:", error);
      const message = error instanceof SyntaxError
        ? "Build and deploy config must be valid JSON objects."
        : parseErrorMessage(error);
      showErrorToast("Failed to register application", message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Register User Application</DialogTitle>
          <DialogDescription>
            Capture the repository, deployment mode, and infra dependencies we should manage.
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="app-name">Name</Label>
              <Input id="app-name" value={name} onChange={(event) => setName(event.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="repo-url">Repository URL</Label>
              <Input id="repo-url" value={repositoryUrl} onChange={(event) => setRepositoryUrl(event.target.value)} required />
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={description} onChange={(event) => setDescription(event.target.value)} rows={3} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="manifest-path">Manifest Path</Label>
              <Input id="manifest-path" value={manifestPath} onChange={(event) => setManifestPath(event.target.value)} placeholder="package.json or go.mod" />
            </div>
            <div className="grid gap-2">
              <Label>Source Kind</Label>
              <Select value={sourceKind} onValueChange={setSourceKind}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">manual</SelectItem>
                  <SelectItem value="package.json">package.json</SelectItem>
                  <SelectItem value="go.mod">go.mod</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Deploy Kind</Label>
              <Select value={deployKind} onValueChange={setDeployKind}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="systemd_service">systemd_service</SelectItem>
                  <SelectItem value="nginx_static_site">nginx_static_site</SelectItem>
                  <SelectItem value="library">library</SelectItem>
                  <SelectItem value="migrations">migrations</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="package-manager">Package Manager</Label>
              <Input id="package-manager" value={packageManager} onChange={(event) => setPackageManager(event.target.value)} placeholder="npm, go, pnpm..." />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="package-name">Package Name</Label>
              <Input id="package-name" value={packageName} onChange={(event) => setPackageName(event.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="module-name">Module Name</Label>
              <Input id="module-name" value={moduleName} onChange={(event) => setModuleName(event.target.value)} />
            </div>
          </div>

          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <div>
                <Label>Infra Dependencies</Label>
                <p className="text-sm text-muted-foreground">
                  Pick the host and platform types this application expects.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDependencies((current) => [...current, createDependencyDraft()])}
              >
                <Plus className="h-4 w-4" />
                Add Dependency
              </Button>
            </div>

            <div className="grid gap-3">
              {dependencies.map((dependency) => {
                const options = getDependencyOptions(dependency.dependencyType);
                return (
                  <div key={dependency.key} className="grid gap-3 rounded-lg border p-3 md:grid-cols-[180px_1fr_auto]">
                    <Select
                      value={dependency.dependencyType}
                      onValueChange={(value: DependencyDraft["dependencyType"]) =>
                        setDependencies((current) =>
                          current.map((item) =>
                            item.key === dependency.key
                              ? { ...item, dependencyType: value, selectedId: "" }
                              : item
                          )
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="platform_type">platform_type</SelectItem>
                        <SelectItem value="host_server_type">host_server_type</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={dependency.selectedId}
                      onValueChange={(value) =>
                        setDependencies((current) =>
                          current.map((item) =>
                            item.key === dependency.key ? { ...item, selectedId: value } : item
                          )
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a dependency target" />
                      </SelectTrigger>
                      <SelectContent>
                        {options.map((option) => (
                          <SelectItem key={option.id} value={option.id || ""}>
                            {option.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setDependencies((current) =>
                          current.length === 1 ? [createDependencyDraft()] : current.filter((item) => item.key !== dependency.key)
                        )
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="build-config-json">Build Config JSON</Label>
              <Textarea
                id="build-config-json"
                rows={8}
                value={buildConfigJson}
                onChange={(event) => setBuildConfigJson(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="deploy-config-json">Deploy Config JSON</Label>
              <Textarea
                id="deploy-config-json"
                rows={8}
                value={deployConfigJson}
                onChange={(event) => setDeployConfigJson(event.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Registering..." : "Register Application"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
