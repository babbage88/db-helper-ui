"use client";

import * as React from "react";
import {
  Boxes,
  Globe,
  HardDrive,
  Plus,
  RefreshCw,
  Server,
  ShieldCheck,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

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

type ApplicationKind = "go_service" | "frontend_spa";
type RuntimeTarget = "linux_vps" | "linux_vm" | "linux_bare_metal";

type DependencyOption = {
  key: string;
  label: string;
  description: string;
  hostServerTypeName?: string;
  platformTypeName?: string;
};

const dependencyOptions: DependencyOption[] = [
  {
    key: "app_server",
    label: "Application Server",
    description: "The app needs a host intended to run application workloads.",
    hostServerTypeName: "Application Server",
  },
  {
    key: "nginx",
    label: "Nginx Static Hosting",
    description: "The app should be served as static files behind nginx.",
    platformTypeName: "Nginx Server",
  },
  {
    key: "postgres",
    label: "Postgres",
    description: "The app needs a Postgres database provisioned for it.",
    platformTypeName: "Postgres SQL",
  },
  {
    key: "valkey",
    label: "Valkey",
    description: "The app needs Valkey for sessions, queues, or caching.",
    platformTypeName: "Valkey",
  },
  {
    key: "garage",
    label: "S3 Storage",
    description: "The app needs an S3-compatible object storage endpoint.",
    platformTypeName: "Garage S3",
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

function buildDependencyRequest(args: {
  dependencyName: string;
  hostServerTypeName?: string;
  platformTypeName?: string;
  hostServerTypes: HostServerType[];
  platformTypes: PlatformType[];
}): CreateInfraDependencyRequest {
  const hostType = args.hostServerTypeName
    ? args.hostServerTypes.find((item) => item.name === args.hostServerTypeName)
    : undefined;
  const platformType = args.platformTypeName
    ? args.platformTypes.find((item) => item.name === args.platformTypeName)
    : undefined;

  return {
    dependencyName: args.dependencyName,
    dependencyType: args.hostServerTypeName ? "host_server_type" : "platform_type",
    hostServerTypeId: hostType?.id,
    platformTypeId: platformType?.id,
  };
}

function buildRuntimeDependency(
  runtimeTarget: RuntimeTarget,
  platformTypes: PlatformType[],
): CreateInfraDependencyRequest {
  const platformName =
    runtimeTarget === "linux_vm"
      ? "Linux VM"
      : runtimeTarget === "linux_bare_metal"
        ? "Linux Bare Metal"
        : "Linux VPS";
  const platformType = platformTypes.find((item) => item.name === platformName);
  return {
    dependencyName: platformName,
    dependencyType: "platform_type",
    platformTypeId: platformType?.id,
  };
}

function deriveRepoSlug(repositoryUrl: string) {
  const trimmed = repositoryUrl.trim().replace(/\/+$/, "");
  if (!trimmed) return "";
  const withoutGit = trimmed.replace(/\.git$/i, "");
  const segments = withoutGit.split("/");
  return segments[segments.length - 1] || "";
}

function deriveModuleName(repositoryUrl: string) {
  const trimmed = repositoryUrl.trim().replace(/\/+$/, "");
  if (!trimmed) return "";

  try {
    const parsed = new URL(trimmed);
    return `${parsed.host}${parsed.pathname.replace(/\.git$/i, "")}`.replace(/^\/+/, "");
  } catch {
    return trimmed.replace(/^https?:\/\//i, "").replace(/\.git$/i, "");
  }
}

function slugifyAppName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function readOptionalStringRecordValue(
  value: Record<string, unknown> | undefined,
  key: string,
) {
  const candidate = value?.[key];
  return typeof candidate === "string" && candidate.trim() ? candidate : undefined;
}

export default function ManageUserApplicationsPage() {
  const [applications, setApplications] = React.useState<UserApplicationDao[]>([]);
  const [hostServerTypes, setHostServerTypes] = React.useState<HostServerType[]>([]);
  const [platformTypes, setPlatformTypes] = React.useState<PlatformType[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);

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
                  Register a real application the way a user would: source repo, deployment
                  shape, runtime target, and the infrastructure it needs.
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => loadPageData()}>
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Register Application
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <Card className="border-dashed">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">1. Basics</CardTitle>
                <CardDescription>
                  Start with the application name and source repository URL.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-dashed">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">2. Deploy Shape</CardTitle>
                <CardDescription>
                  Choose whether this is a Go service or a frontend SPA and how it should land.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-dashed">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">3. Dependencies</CardTitle>
                <CardDescription>
                  Capture things like Postgres, Valkey, S3, nginx hosting, and Linux target.
                </CardDescription>
              </CardHeader>
            </Card>
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
                          <CardDescription>
                            {application.description || application.repositoryUrl}
                          </CardDescription>
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
                        <div className="break-all text-muted-foreground">
                          {application.repositoryUrl}
                        </div>
                      </div>
                      <div className="grid gap-1 md:grid-cols-2 md:gap-4">
                        <div>
                          <div className="font-medium">Manifest</div>
                          <div className="text-muted-foreground">
                            {application.manifestPath || "Not specified"}
                          </div>
                        </div>
                        <div>
                          <div className="font-medium">Package / Module</div>
                          <div className="text-muted-foreground">
                            {application.packageName ||
                              application.moduleName ||
                              "Not specified"}
                          </div>
                        </div>
                      </div>
                      <div className="grid gap-1 md:grid-cols-2 md:gap-4">
                        <div>
                          <div className="font-medium">Branch</div>
                          <div className="text-muted-foreground">
                            {readOptionalStringRecordValue(
                              application.buildConfig as Record<string, unknown> | undefined,
                              "branch",
                            ) || "Default branch"}
                          </div>
                        </div>
                        <div>
                          <div className="font-medium">Tag</div>
                          <div className="text-muted-foreground">
                            {readOptionalStringRecordValue(
                              application.buildConfig as Record<string, unknown> | undefined,
                              "tag",
                            ) || "Not pinned"}
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
                            <span className="text-muted-foreground">
                              No dependencies recorded.
                            </span>
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
  const [step, setStep] = React.useState<1 | 2>(1);
  const [applicationKind, setApplicationKind] = React.useState<ApplicationKind>("go_service");
  const [runtimeTarget, setRuntimeTarget] = React.useState<RuntimeTarget>("linux_vps");
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [repositoryUrl, setRepositoryUrl] = React.useState("");
  const [branch, setBranch] = React.useState("");
  const [tag, setTag] = React.useState("");
  const [needsPostgres, setNeedsPostgres] = React.useState(false);
  const [needsValkey, setNeedsValkey] = React.useState(false);
  const [needsGarage, setNeedsGarage] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setStep(1);
      setApplicationKind("go_service");
      setRuntimeTarget("linux_vps");
      setName("");
      setDescription("");
      setRepositoryUrl("");
      setBranch("");
      setTag("");
      setNeedsPostgres(false);
      setNeedsValkey(false);
      setNeedsGarage(false);
      setIsSubmitting(false);
    }
  }, [open]);

  React.useEffect(() => {
    if (name.trim()) return;
    const repoSlug = deriveRepoSlug(repositoryUrl);
    if (repoSlug) {
      setName(repoSlug);
    }
  }, [name, repositoryUrl]);

  const deployKind =
    applicationKind === "go_service" ? "systemd_service" : "nginx_static_site";
  const sourceKind = applicationKind === "go_service" ? "go.mod" : "package.json";
  const normalizedName = slugifyAppName(name) || "app";
  const derivedModuleName = deriveModuleName(repositoryUrl);
  const derivedPackageName = deriveRepoSlug(repositoryUrl) || normalizedName;
  const derivedManifestPath = applicationKind === "go_service" ? "go.mod" : "package.json";
  const derivedPackageManager = applicationKind === "go_service" ? "go" : "npm";
  const derivedBuildConfig =
    applicationKind === "go_service"
      ? {
          installCommand: "go mod download",
          buildCommand: `go build -o dist/${normalizedName} .`,
          entryPackage: ".",
          branch: branch.trim() || undefined,
          tag: tag.trim() || undefined,
        }
      : {
          installCommand: "npm ci",
          buildCommand: "npm run build",
          branch: branch.trim() || undefined,
          tag: tag.trim() || undefined,
        };
  const derivedDeployConfig =
    applicationKind === "go_service"
      ? {
          appName: normalizedName,
          destinationBinary: normalizedName,
          installDir: `/opt/${normalizedName}`,
          systemdUnit: `${normalizedName}.service`,
        }
      : {
          artifactPath: "dist",
          webRoot: `/usr/share/nginx/html/${normalizedName}`,
          webServer: "nginx",
        };

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (step === 1) {
      setStep(2);
      return;
    }
    setIsSubmitting(true);
    try {
      const dependencies: CreateInfraDependencyRequest[] = [];

      dependencies.push(
        buildDependencyRequest({
          dependencyName: "Application Server",
          hostServerTypeName: "Application Server",
          hostServerTypes,
          platformTypes,
        }),
      );

      dependencies.push(buildRuntimeDependency(runtimeTarget, platformTypes));

      if (applicationKind === "frontend_spa") {
        dependencies.push(
          buildDependencyRequest({
            dependencyName: "Nginx Server",
            platformTypeName: "Nginx Server",
            hostServerTypes,
            platformTypes,
          }),
        );
      }
      if (needsPostgres) {
        dependencies.push(
          buildDependencyRequest({
            dependencyName: "Postgres SQL",
            platformTypeName: "Postgres SQL",
            hostServerTypes,
            platformTypes,
          }),
        );
      }
      if (needsValkey) {
        dependencies.push(
          buildDependencyRequest({
            dependencyName: "Valkey",
            platformTypeName: "Valkey",
            hostServerTypes,
            platformTypes,
          }),
        );
      }
      if (needsGarage) {
        dependencies.push(
          buildDependencyRequest({
            dependencyName: "Garage S3",
            platformTypeName: "Garage S3",
            hostServerTypes,
            platformTypes,
          }),
        );
      }

      const payload: CreateUserApplicationRequest = {
        name,
        description,
        repositoryUrl,
        manifestPath: derivedManifestPath,
        sourceKind,
        deployKind,
        packageManager: derivedPackageManager,
        packageName: applicationKind === "frontend_spa" ? derivedPackageName : undefined,
        moduleName: applicationKind === "go_service" ? derivedModuleName || undefined : undefined,
        registerable: true,
        buildConfig: derivedBuildConfig,
        deployConfig: derivedDeployConfig,
        infraDependencies: dependencies,
      };

      await UserApplicationsService.createUserApplication(payload);
      showSuccessToast(`Registered ${name}`, "The application was added to infractl.");
      onOpenChange(false);
      await onCreated();
    } catch (error) {
      console.error("Failed to create user application:", error);
      showErrorToast("Failed to register application", parseErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Register User Application</DialogTitle>
          <DialogDescription>
            Start with the repo. We will keep the first step minimal and generate
            the noisy deployment defaults behind the scenes.
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-6" onSubmit={handleSubmit}>
          <section className="grid gap-3 rounded-xl border border-dashed p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="font-medium">Step {step} of 2</div>
              <div className="flex gap-2">
                <Badge variant={step === 1 ? "default" : "outline"}>Basics</Badge>
                <Badge variant={step === 2 ? "default" : "outline"}>Intent</Badge>
              </div>
            </div>
          </section>

          {step === 1 ? (
            <section className="grid gap-4">
              <div>
                <h3 className="font-semibold">Basics</h3>
                <p className="text-sm text-muted-foreground">
                  Start with the two things a user actually knows. We can infer the rest later.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="app-name">Application Name</Label>
                  <Input
                    id="app-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="repo-url">Repository URL</Label>
                  <Input
                    id="repo-url"
                    value={repositoryUrl}
                    onChange={(event) => setRepositoryUrl(event.target.value)}
                    placeholder="https://github.com/org/repo"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="branch">Branch</Label>
                  <Input
                    id="branch"
                    value={branch}
                    onChange={(event) => setBranch(event.target.value)}
                    placeholder="Optional. Leave blank for the repo default branch."
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tag">Tag</Label>
                  <Input
                    id="tag"
                    value={tag}
                    onChange={(event) => setTag(event.target.value)}
                    placeholder="Optional. Pin this registration to a release tag."
                  />
                </div>
                <div className="grid gap-2 md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    rows={3}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Optional for now. We can also infer this later."
                  />
                </div>
              </div>
              <section className="grid gap-3 rounded-xl border border-dashed p-4">
                <div className="font-medium">Next</div>
                <p className="text-sm text-muted-foreground">
                  The next step stays at the intent level: what kind of app this is, where it
                  runs, and whether it needs Postgres, Valkey, or S3-style storage.
                </p>
              </section>
            </section>
          ) : (
            <>
              <section className="grid gap-4">
                <div>
                  <h3 className="font-semibold">Application Type</h3>
                  <p className="text-sm text-muted-foreground">
                    Pick the closest deployment shape. We generate the lower-level defaults
                    instead of asking you for install commands and module paths up front.
                  </p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <button
                    type="button"
                    className={cn(
                      "rounded-xl border p-4 text-left transition-colors",
                      applicationKind === "go_service"
                        ? "border-primary bg-primary/5"
                        : "hover:bg-accent/50",
                    )}
                    onClick={() => setApplicationKind("go_service")}
                  >
                    <div className="flex items-center gap-2 font-medium">
                      <Server className="h-4 w-4" />
                      Go Service
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Backend API or worker deployed as a remote systemd service.
                    </p>
                  </button>
                  <button
                    type="button"
                    className={cn(
                      "rounded-xl border p-4 text-left transition-colors",
                      applicationKind === "frontend_spa"
                        ? "border-primary bg-primary/5"
                        : "hover:bg-accent/50",
                    )}
                    onClick={() => setApplicationKind("frontend_spa")}
                  >
                    <div className="flex items-center gap-2 font-medium">
                      <Globe className="h-4 w-4" />
                      Frontend SPA
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Static frontend build published behind nginx.
                    </p>
                  </button>
                </div>
              </section>

              <section className="grid gap-4">
                <div>
                  <h3 className="font-semibold">Runtime Target</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose the Linux environment this application is expected to run on.
                  </p>
                </div>
                <div className="grid gap-2 md:grid-cols-3">
                  <Button
                    type="button"
                    variant={runtimeTarget === "linux_vps" ? "default" : "outline"}
                    onClick={() => setRuntimeTarget("linux_vps")}
                  >
                    Linux VPS
                  </Button>
                  <Button
                    type="button"
                    variant={runtimeTarget === "linux_vm" ? "default" : "outline"}
                    onClick={() => setRuntimeTarget("linux_vm")}
                  >
                    Linux VM
                  </Button>
                  <Button
                    type="button"
                    variant={runtimeTarget === "linux_bare_metal" ? "default" : "outline"}
                    onClick={() => setRuntimeTarget("linux_bare_metal")}
                  >
                    Linux Bare Metal
                  </Button>
                </div>
              </section>

              <section className="grid gap-4">
                <div>
                  <h3 className="font-semibold">Infrastructure Needs</h3>
                  <p className="text-sm text-muted-foreground">
                    Pick the managed infrastructure this application should get in staging.
                  </p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {dependencyOptions
                    .filter((option) => applicationKind === "frontend_spa" || option.key !== "nginx")
                    .map((option) => {
                      const checked =
                        option.key === "nginx"
                          ? applicationKind === "frontend_spa"
                          : option.key === "postgres"
                            ? needsPostgres
                            : option.key === "valkey"
                              ? needsValkey
                              : option.key === "garage"
                                ? needsGarage
                                : true;

                      const disabled = option.key === "app_server" || option.key === "nginx";

                      return (
                        <label
                          key={option.key}
                          className={cn(
                            "flex items-start gap-3 rounded-xl border p-4",
                            checked ? "border-primary bg-primary/5" : "hover:bg-accent/40",
                            disabled && "opacity-90",
                          )}
                        >
                          <Checkbox
                            checked={checked}
                            disabled={disabled}
                            onCheckedChange={(value) => {
                              const next = value === true;
                              if (option.key === "postgres") setNeedsPostgres(next);
                              if (option.key === "valkey") setNeedsValkey(next);
                              if (option.key === "garage") setNeedsGarage(next);
                            }}
                          />
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 font-medium">
                              {option.key === "postgres" ? (
                                <HardDrive className="h-4 w-4" />
                              ) : option.key === "garage" ? (
                                <ShieldCheck className="h-4 w-4" />
                              ) : (
                                <Server className="h-4 w-4" />
                              )}
                              {option.label}
                              {disabled ? <Badge variant="outline">required</Badge> : null}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {option.description}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                </div>
              </section>

              <section className="grid gap-3 rounded-xl border border-dashed p-4">
                <div className="font-medium">Generated Defaults</div>
                <p className="text-sm text-muted-foreground">
                  These are inferred defaults we will store for now. The server-side repo
                  analysis pass should eventually replace these with real detection.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge>{deployKind}</Badge>
                  <Badge variant="outline">{sourceKind}</Badge>
                  <Badge variant="outline">{derivedManifestPath}</Badge>
                  <Badge variant="outline">{derivedPackageManager}</Badge>
                  {branch.trim() ? <Badge variant="outline">branch:{branch.trim()}</Badge> : null}
                  {tag.trim() ? <Badge variant="outline">tag:{tag.trim()}</Badge> : null}
                  {applicationKind === "go_service" && derivedModuleName ? (
                    <Badge variant="secondary">{derivedModuleName}</Badge>
                  ) : null}
                  {applicationKind === "frontend_spa" ? (
                    <Badge variant="secondary">{derivedPackageName}</Badge>
                  ) : null}
                </div>
              </section>
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {step === 2 ? (
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
            ) : null}
            <Button type="submit" disabled={isSubmitting}>
              {step === 1 ? "Next" : isSubmitting ? "Registering..." : "Register Application"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
