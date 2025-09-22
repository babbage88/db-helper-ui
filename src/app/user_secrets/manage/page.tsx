"use client";

import * as React from "react";
import { Plus, Calendar as CalendarIcon } from "lucide-react";

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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

import { SecretsService } from "@/lib/api/services/SecretsService";
import { useAuth } from "@/lib/auth-context";
import { TokenService } from "@/lib/tokenManager";

import { DataTable } from "@/app/user_secrets/manage/data-table";
import type { UserSecret } from "@/app/user_secrets/manage/columns";
import { ExternalApplicationsService } from "@/lib/api/services/ExternalApplicationsService";
import type { ExternalApplicationInfo } from "@/lib/api/models/ExternalApplicationInfo";

export default function ManageSecretsPage() {
  const [secrets, setSecrets] = React.useState<UserSecret[]>([]);
  const { isAuthenticated } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchSecrets = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const userInfo = TokenService.getUserInfo();
      if (!userInfo || !userInfo.userId) {
        console.error("User not logged in");
        setSecrets([]);
        return;
      }

      const resp = await SecretsService.getUserSecretEntries(userInfo.userId);

      const mapped = await Promise.all(
        (resp || []).map(async (entry): Promise<UserSecret> => {
          const meta = entry.secretMetadata;
          const app = entry.appInfo;

          let appName = app?.name || "";
          if (!appName && app?.id) {
            try {
              const appResp =
                await ExternalApplicationsService.getExternalApplicationNameById(
                  app.id
                );
              appName = appResp.name || app?.id || "";
            } catch (err) {
              console.warn(
                `Failed to resolve application name for id=${app?.id}`,
                err
              );
              appName = app?.id || "";
            }
          }

          return {
            id: meta?.id || "",
            external_application_id: appName,
            secret: "",
            expiration: meta?.expiry,
            user_id: meta?.userId || userInfo.userId,
          };
        })
      );

      setSecrets(mapped);
    } catch (err) {
      console.error("Failed to fetch secrets:", err);
      setSecrets([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (isAuthenticated) {
      fetchSecrets();
    }
  }, [isAuthenticated, fetchSecrets]);

  const handleAddSecretSuccess = () => {
    fetchSecrets();
    setIsAddDialogOpen(false);
  };

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Secrets</CardTitle>
              <CardDescription>
                Manage your application secrets.
              </CardDescription>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Secret
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading...</div>
          ) : (
            <DataTable
              data={secrets}
              onChange={fetchSecrets}
              userId={TokenService.getUserInfo()?.userId || ""}
            />
          )}
        </CardContent>
      </Card>

      <AddSecretDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={handleAddSecretSuccess}
      />
    </div>
  );
}

function AddSecretDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [appId, setAppId] = React.useState("");
  const [secretVal, setSecretVal] = React.useState("");
  const [expiration, setExpiration] = React.useState<Date | undefined>(
    undefined
  );
  const [expirationInput, setExpirationInput] = React.useState("");
  const [expirationMonth, setExpirationMonth] = React.useState<
    Date | undefined
  >(expiration);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [apps, setApps] = React.useState<ExternalApplicationInfo[]>([]);
  const [isLoadingApps, setIsLoadingApps] = React.useState(true);
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      const loadApps = async () => {
        setIsLoadingApps(true);
        try {
          const resp =
            await ExternalApplicationsService.getAllExternalApplications();
          setApps(resp || []);
        } catch (err) {
          console.error("Failed to load external applications:", err);
          setApps([]);
        } finally {
          setIsLoadingApps(false);
        }
      };
      loadApps();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const userInfo = TokenService.getUserInfo();
      if (!userInfo || !userInfo.userId) {
        throw new Error("User not logged in");
      }

      await SecretsService.createUserSecret({
        application_id: appId,
        secret: secretVal,
        expiration: expiration ? expiration.toISOString() : undefined,
      });

      setAppId("");
      setSecretVal("");
      setExpiration(undefined);
      setExpirationInput("");
      onSuccess();
    } catch (err) {
      console.error("Failed to create secret:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  function formatDate(date: Date | undefined) {
    if (!date) return "";
    return date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  function isValidDate(date: Date | undefined) {
    return date instanceof Date && !isNaN(date.getTime());
  }

  return (
    <Dialog open={open} onOpenChange={(o) => onOpenChange(o)}>
      <DialogContent
        // ✅ prevent dialog from closing popover immediately
        onPointerDownOutside={(e) => {
          if (isCalendarOpen) e.preventDefault();
        }}
        onInteractOutside={(e) => {
          if (isCalendarOpen) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Create Secret</DialogTitle>
          <DialogDescription>
            Add a new application secret for your account.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Application selector */}
          <div className="space-y-2">
            <Label htmlFor="app-id">Application</Label>
            {isLoadingApps ? (
              <div>Loading applications...</div>
            ) : (
              <Select value={appId} onValueChange={setAppId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an application" />
                </SelectTrigger>
                <SelectContent>
                  {apps.map((app) => (
                    <SelectItem key={app.id} value={app.id || ""}>
                      {app.name || app.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Secret input */}
          <div className="space-y-2">
            <Label htmlFor="secret">Secret</Label>
            <Input
              id="secret"
              value={secretVal}
              onChange={(e) => setSecretVal(e.target.value)}
              placeholder="Paste the secret value"
            />
          </div>

          {/* Expiration date picker */}
          <div className="space-y-2">
            <Label htmlFor="expiry">Expiration (optional)</Label>
            <div className="relative flex gap-2">
              <Input
                id="expiry"
                value={expirationInput}
                placeholder="Pick a date"
                className="bg-background pr-10"
                onChange={(e) => {
                  setExpirationInput(e.target.value);
                  const date = new Date(e.target.value);
                  if (isValidDate(date)) {
                    setExpiration(date);
                    setExpirationMonth(date);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setIsCalendarOpen(true);
                  }
                }}
              />
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen} modal={true}>
                <PopoverTrigger asChild>
                  <Button
                    id="date-picker"
                    variant="ghost"
                    className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
                  >
                    <CalendarIcon className="size-3.5" />
                    <span className="sr-only">Select date</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto overflow-hidden p-0"
                  align="end"
                  alignOffset={-8}
                  sideOffset={10}
                >
                  <Calendar
                    mode="single"
                    selected={expiration}
                    captionLayout="dropdown"
                    month={expirationMonth}
                    onMonthChange={setExpirationMonth}
                    onSelect={(date) => {
                      if (!date) return;
                      setExpiration(date);
                      setExpirationInput(formatDate(date));
                      setIsCalendarOpen(false); // ✅ close popover only after selecting
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !appId || !secretVal}
            >
              {isSubmitting ? "Creating..." : "Create Secret"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
