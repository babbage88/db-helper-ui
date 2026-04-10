"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PermissionsCrudService } from "@/lib/api/services/PermissionsCrudService";
import type { AppPermissionDao } from "@/lib/api/models/AppPermissionDao";
import type { RoleRow } from "./role-columns";
import { showSuccessToast, showErrorToast } from "@/lib/toast-utils";
import { MultiSelectCombobox } from "@/components/ui/multi-select-combobox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import type { GetRolePermissionMappingsResponse } from "@/lib/api/models/GetRolePermissionMappingsResponse";

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
  const [assignedPermissions, setAssignedPermissions] = React.useState<AppPermissionDao[]>([]);
  const [selectedPermissions, setSelectedPermissions] = React.useState<Set<string>>(new Set());
  const assignedPermissionIds = React.useMemo(
    () =>
      new Set(
        assignedPermissions
          .map((permission) => permission.id)
          .filter((permissionId): permissionId is string => Boolean(permissionId))
      ),
    [assignedPermissions]
  );
  const pendingAdds = React.useMemo(
    () => Array.from(selectedPermissions).filter((permissionId) => !assignedPermissionIds.has(permissionId)),
    [assignedPermissionIds, selectedPermissions]
  );
  const pendingRemovals = React.useMemo(
    () => Array.from(assignedPermissionIds).filter((permissionId) => !selectedPermissions.has(permissionId)),
    [assignedPermissionIds, selectedPermissions]
  );
  const pendingChangeCount = pendingAdds.length + pendingRemovals.length;

  React.useEffect(() => {
    if (!open) {
      setError(null);
      setPermissions([]);
      setAssignedPermissions([]);
      setSelectedPermissions(new Set());
      return;
    }

    const loadPermissions = async () => {
      if (!role?.id) {
        setPermissions([]);
        setAssignedPermissions([]);
        setSelectedPermissions(new Set());
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const [allPermissionsResponse, assignedMappingsResponse] = await Promise.all([
          PermissionsCrudService.getAllAppPermissions(),
          PermissionsCrudService.getAllAppPermissionMappings(role.id, role.roleName),
        ]);

        const permList: AppPermissionDao[] =
          (allPermissionsResponse as any).body?.appPermissions ||
          allPermissionsResponse.appPermissions ||
          (Array.isArray(allPermissionsResponse) ? allPermissionsResponse : []);

        const assignedMappings: GetRolePermissionMappingsResponse[] = Array.isArray(assignedMappingsResponse)
          ? assignedMappingsResponse
          : [];

        const loadedAssignedPermissionIds = new Set(
          assignedMappings
            .map((mapping) => mapping.permissionId)
            .filter((permissionId): permissionId is string => Boolean(permissionId))
        );

        const assignedPermissionList = permList.filter(
          (permission) => permission.id && loadedAssignedPermissionIds.has(permission.id)
        );

        setPermissions(permList);
        setAssignedPermissions(assignedPermissionList);
        setSelectedPermissions(loadedAssignedPermissionIds);
      } catch (err: any) {
        console.error("Failed to load permissions:", err);
        setAssignedPermissions([]);
        setSelectedPermissions(new Set());
        setError("Failed to load role permissions");
      } finally {
        setIsLoading(false);
      }
    };

    loadPermissions();
  }, [open, role]);

  /*  const handlePermissionToggle = (permissionId: string) => {
      const newSelected = new Set(selectedPermissions);
      if (newSelected.has(permissionId)) {
        newSelected.delete(permissionId);
      } else {
        newSelected.add(permissionId);
      }
      setSelectedPermissions(newSelected);
    };
  */

  const handleSubmit = async () => {
    if (!role) return;

    try {
      setIsSubmitting(true);
      setError(null);

      if (pendingChangeCount === 0) {
        onOpenChange(false);
        return;
      }

      await Promise.all(
        pendingAdds.map((permId) =>
          PermissionsCrudService.createRolePermissionMapping({
            roleId: role.id,
            permId: permId,
          })
        )
      );
      await Promise.all(
        pendingRemovals.map((permId) =>
          PermissionsCrudService.deleteRolePermissionMapping({
            roleId: role.id,
            permId: permId,
          })
        )
      );

      onOpenChange(false);
      showSuccessToast(
        "Permissions updated",
        `Added ${pendingAdds.length} and removed ${pendingRemovals.length} permission(s) for "${role.roleName}".`
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
            Select which permissions to assign to the "{role?.roleName}" role. Existing assignments are preselected.
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
          <div className="space-y-6">
            {/* Current Permissions Section */}
            {assignedPermissions.length > 0 && (
              <div className="space-y-2">
                <Label className="font-semibold">Currently Assigned Permissions</Label>
                <div className="flex flex-wrap gap-2">
                  {assignedPermissions.map((perm) => (
                    <Badge key={perm.id} variant="default" className="flex items-center gap-2">
                      {perm.permissionName}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {assignedPermissions.length === 0 && (
              <Alert>
                <AlertDescription>
                  No permissions currently assigned
                </AlertDescription>
              </Alert>
            )}

            {/* Role Selector */}
            <div className="space-y-3">
              <Label className="font-semibold">Assign Permissions</Label>

              {permissions.length === 0 ? (
                <Alert>
                  <AlertDescription className="text-yellow-900 text-sm">
                    No permissions available on the server
                  </AlertDescription>
                </Alert>
              ) : (
                <MultiSelectCombobox
                  options={permissions
                    .filter((r) => r.id)
                    .map((r) => ({
                      value: r.id!,
                      label: r.permissionName || "Unnamed Permission",
                      description: r.permissionDescription,
                    }))}
                  value={Array.from(selectedPermissions)}
                  onChange={(values) => setSelectedPermissions(new Set(values))}
                  placeholder="Select permissions..."
                  disabled={isSubmitting}
                />
              )}
            </div>
          </div>
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
            disabled={isSubmitting || isLoading || pendingChangeCount === 0}
          >
            {isSubmitting ? "Updating..." : `Update Permissions (${pendingChangeCount})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
