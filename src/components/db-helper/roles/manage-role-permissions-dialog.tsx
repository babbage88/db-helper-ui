"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PermissionsCrudService } from "@/lib/api/services/PermissionsCrudService";
import type { AppPermissionDao } from "@/lib/api/models/AppPermissionDao";
import type { RoleRow } from "./role-columns";
import { showSuccessToast, showErrorToast } from "@/lib/toast-utils";

interface ManageRolePermissionsDialogProps {
  open: boolean;
  role: RoleRow | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ManageRolePermissionsDialog({
  open,
  role,
  onOpenChange,
  onSuccess,
}: ManageRolePermissionsDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [permissions, setPermissions] = React.useState<AppPermissionDao[]>([]);
  const [selectedPermissions, setSelectedPermissions] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    if (!open) {
      setError(null);
      setSelectedPermissions(new Set());
      return;
    }

    const loadPermissions = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await PermissionsCrudService.getAllAppPermissions();
        // Handle response structure - permissions might be in body.appPermissions or just appPermissions
        const permList = 
          (response as any).body?.appPermissions || 
          response.appPermissions || 
          (Array.isArray(response) ? response : []);
        console.log("Loaded permissions:", permList);
        setPermissions(permList);
      } catch (err: any) {
        console.error("Failed to load permissions:", err);
        setError("Failed to load available permissions");
      } finally {
        setIsLoading(false);
      }
    };

    loadPermissions();
  }, [open, role]);

  const handlePermissionToggle = (permissionId: string) => {
    const newSelected = new Set(selectedPermissions);
    if (newSelected.has(permissionId)) {
      newSelected.delete(permissionId);
    } else {
      newSelected.add(permissionId);
    }
    setSelectedPermissions(newSelected);
  };

  const handleSubmit = async () => {
    if (!role) return;

    try {
      setIsSubmitting(true);
      setError(null);

      // Map selected permissions to role
      const permissionIds = Array.from(selectedPermissions);
      
      await Promise.all(
        permissionIds.map((permId) =>
          PermissionsCrudService.createRolePermissionMapping({
            roleId: role.id,
            permId: permId,
          })
        )
      );

      onOpenChange(false);
      showSuccessToast(
        "Permissions updated",
        `${permissionIds.length} permission(s) assigned to the "${role.roleName}" role.`
      );
      onSuccess();
    } catch (err: any) {
      console.error("Failed to update role permissions:", err);
      const errorMessage = err?.message || "Failed to update permissions. Please try again.";
      setError(errorMessage);
      showErrorToast("Failed to update permissions", errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Role Permissions</DialogTitle>
          <DialogDescription>
            Select which permissions to assign to the "{role?.roleName}" role.
            {selectedPermissions.size > 0 && (
              <span className="ml-2 font-semibold text-foreground">
                ({selectedPermissions.size} selected)
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
            <p className="font-medium">Error</p>
            <p>{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading permissions...</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] border rounded-md p-4">
            <div className="space-y-3 pr-4">
              {permissions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No permissions available
                </p>
              ) : (
                permissions.map((permission) => (
                  <div
                    key={permission.id}
                    className="flex items-start space-x-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => handlePermissionToggle(permission.id || "")}
                  >
                    <Checkbox
                      id={permission.id}
                      checked={selectedPermissions.has(permission.id || "")}
                      onCheckedChange={() =>
                        handlePermissionToggle(permission.id || "")
                      }
                      className="mt-1"
                    />
                    <Label
                      htmlFor={permission.id}
                      className="flex flex-col cursor-pointer flex-1"
                    >
                      <span className="font-medium text-sm">{permission.permissionName}</span>
                      {permission.permissionDescription && (
                        <span className="text-xs text-muted-foreground mt-1">
                          {permission.permissionDescription}
                        </span>
                      )}
                    </Label>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || isLoading || selectedPermissions.size === 0}
          >
            {isSubmitting ? "Updating..." : `Update Permissions (${selectedPermissions.size})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
