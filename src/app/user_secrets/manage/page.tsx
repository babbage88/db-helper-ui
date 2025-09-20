"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { SecretsService } from "@/lib/api/services/SecretsService";
import { useAuth } from "@/lib/auth-context";
import { TokenService } from "@/lib/tokenManager";

import { DataTable } from "@/app/user_secrets/manage/data-table";
import type { UserSecret } from "@/app/user_secrets/manage/columns";

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
      // resp: Array<UserSecretEntry> where each has appInfo and secretMetadata
      const mapped = (resp || []).map((entry): UserSecret => {
        const meta = entry.secretMetadata;
        const app = entry.appInfo;
        return {
          id: meta?.id || "",
          external_application_id: app?.id || app?.name || "",
          secret: "", // do not expose actual secret here; create dialog will set it when creating
          expiration: meta?.expiry,
          user_id: meta?.userId || userInfo.userId,
        };
      });

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
              <CardDescription>Manage your application secrets.</CardDescription>
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
            <DataTable data={secrets} onChange={fetchSecrets} userId={TokenService.getUserInfo()?.userId || ""} />
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

/* Inline AddSecretDialog so the page is self-contained.
   You can move this to a shared component if you prefer (e.g. components/db-helper/add-secret-dialog). */
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
  const [expiration, setExpiration] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

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
        expiration: expiration || undefined
      });

      // reset fields
      setAppId("");
      setSecretVal("");
      setExpiration("");

      onSuccess();
    } catch (err) {
      console.error("Failed to create secret:", err);
      // optionally show toast / error UI
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => onOpenChange(o)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Secret</DialogTitle>
          <DialogDescription>Add a new application secret for your account.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="app-id">Application ID or Name</Label>
            <Input
              id="app-id"
              value={appId}
              onChange={(e) => setAppId(e.target.value)}
              placeholder="application id (or name)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="secret">Secret</Label>
            <Input
              id="secret"
              value={secretVal}
              onChange={(e) => setSecretVal(e.target.value)}
              placeholder="paste the secret value"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiry">Expiration (optional)</Label>
            <Input
              id="expiry"
              type="date"
              value={expiration}
              onChange={(e) => setExpiration(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !appId || !secretVal}>
              {isSubmitting ? "Creating..." : "Create Secret"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
