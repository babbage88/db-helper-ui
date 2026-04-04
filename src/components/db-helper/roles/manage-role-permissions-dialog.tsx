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
      onSuccess();
    } catch (err: any) {
      console.error("Failed to update role permissions:", err);
      setError(err?.message || "Failed to update permissions. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Role Permissions</DialogTitle>
          <DialogDescription>
            Select which permissions to assign to the "{role?.roleName}" role.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading permissions...</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px] border rounded-md p-4">
            <div className="space-y-3">
              {permissions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No permissions available
                </p>
              ) : (
                permissions.map((permission) => (
                  <div key={permission.id} className="flex items-start space-x-2">
                    <Checkbox
                      id={permission.id}
                      checked={selectedPermissions.has(permission.id || "")}
                      onCheckedChange={() =>
                        handlePermissionToggle(permission.id || "")
                      }
                    />
                    <Label
                      htmlFor={permission.id}
                      className="flex flex-col cursor-pointer pt-1"
                    >
                      <span className="font-medium text-sm">
                        {permission.permissionName}
                      </span>
                      {permission.permissionDescription && (
                        <span className="text-xs text-muted-foreground">
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
            {isSubmitting ? "Updating..." : "Update Permissions"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
