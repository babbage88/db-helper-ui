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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { MultiSelectCombobox } from "@/components/ui/multi-select-combobox";
import { Label } from "@/components/ui/label";
import { RolesCrudService } from "@/lib/api/services/RolesCrudService";
import { UserCrudService } from "@/lib/api/services/UserCrudService";
import type { UpdateUserRoleMappingRequest } from "@/lib/api/models/UpdateUserRoleMappingRequest";
import type { UserRow } from "./user-columns";
import type { UserRoleDao } from "@/lib/api/models/UserRoleDao";
import { showSuccessToast, showErrorToast } from "@/lib/toast-utils";
import { X } from "lucide-react";

interface EditUserRoleDialogProps {
  open: boolean;
  user: UserRow | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditUserRoleDialog({
  open,
  user,
  onOpenChange,
  onSuccess,
}: EditUserRoleDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [allRoles, setAllRoles] = React.useState<UserRoleDao[]>([]);
  const [currentRoles, setCurrentRoles] = React.useState<UserRoleDao[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = React.useState<Set<string>>(new Set());
  const [hasChanges, setHasChanges] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setError(null);
      setCurrentRoles([]);
      setSelectedRoleIds(new Set());
      setHasChanges(false);
      return;
    }

    const loadRoles = async () => {
      try {
        setIsLoading(true);
        const response = await RolesCrudService.getAllUserRoles();
        
        
        console.log("Raw roles response:", response);

        // Extract roles from response - GetAllRolesResponse has userRoles property
        const roleList = 
          (response as any).body?.userRoles || 
          response.userRoles || 
          (Array.isArray(response) ? response : []);
        console.log("Extracted roleList:", roleList);

        // Validate roles have required fields
        const validRoles = roleList.filter((r: UserRoleDao) => r.id && r.roleName);
        console.log("Valid roles:", validRoles);

        if (roleList.length === 0) {
          console.warn("No roles returned from API");
          setError("No roles available on server");
          setAllRoles([]);
        } else if (validRoles.length === 0) {
          console.warn("Roles returned but missing id/roleName:", roleList);
          setError("Role data is incomplete");
          setAllRoles(roleList);
        } else {
          setAllRoles(validRoles);
          setError(null);
        }

        // Find all of the user's current roles
        if (user?.roles && user.roles.length > 0) {
          const userCurrentRoles = validRoles.filter((r: UserRoleDao) =>
            r.roleName && user.roles?.includes(r.roleName)
          );
          console.log("Current user roles:", userCurrentRoles);
          setCurrentRoles(userCurrentRoles);

          // Initialize selected roles with current roles
          const selectedIds = new Set<string>();
          userCurrentRoles.forEach((r: UserRoleDao) => {
            if (r.id) {
              selectedIds.add(r.id);
            }
          });
          setSelectedRoleIds(selectedIds);
        }
      } catch (err) {
        console.error("Failed to load roles:", err);
        setError(`Failed to load available roles: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadRoles();
  }, [open, user]);

  // Track changes between selected and current roles
  React.useEffect(() => {
    if (!currentRoles || currentRoles.length === 0) {
      // If no current roles but selected roles exist, there are changes
      setHasChanges(selectedRoleIds.size > 0);
    } else {
      // Compare selected role IDs with current role IDs
      const currentRoleIds = new Set(
        currentRoles
          .map((r) => r.id)
          .filter((id): id is string => id !== undefined)
      );

      const hasActualChanges =
        selectedRoleIds.size !== currentRoleIds.size ||
        Array.from(selectedRoleIds).some((id) => !currentRoleIds.has(id));

      setHasChanges(hasActualChanges);
    }
  }, [selectedRoleIds, currentRoles]);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && hasChanges) {
      // Dialog is closing and there were changes, reload the data
      onSuccess();
    }
    onOpenChange(newOpen);
  };

  const handleApplyChanges = async () => {
    if (!user) return;

    try {
      setIsSubmitting(true);
      setError(null);

      // Determine which roles to add and which to remove
      const currentRoleIds = new Set(currentRoles.map((r) => r.id).filter((id): id is string => id !== undefined));
      const rolesToAdd: string[] = [];
      const rolesToRemove: string[] = [];

      // Find roles to add (in selected but not in current)
      selectedRoleIds.forEach((roleId) => {
        if (!currentRoleIds.has(roleId)) {
          rolesToAdd.push(roleId);
        }
      });

      // Find roles to remove (in current but not in selected)
      currentRoleIds.forEach((roleId) => {
        if (!selectedRoleIds.has(roleId)) {
          rolesToRemove.push(roleId);
        }
      });

      // Execute all changes
      for (const roleId of rolesToAdd) {
        const role = allRoles.find((r) => r.id === roleId);
        const request: UpdateUserRoleMappingRequest = {
          targetUserId: user.userId,
          roleId,
        };
        await RolesCrudService.updateUserRole(request);
        showSuccessToast(
          "Role added",
          `${user.username} has been assigned the ${role?.roleName} role.`
        );
      }

      for (const roleId of rolesToRemove) {
        const role = allRoles.find((r) => r.id === roleId);
        const request: UpdateUserRoleMappingRequest = {
          targetUserId: user.userId,
          roleId,
        };
        await UserCrudService.disableUserRoleMapping(request);
        showSuccessToast(
          "Role removed",
          `${user.username} has been removed from the ${role?.roleName} role.`
        );
      }

      setCurrentRoles(allRoles.filter((r) => selectedRoleIds.has(r.id || "")));
      showSuccessToast("Success", "User roles have been updated");
    } catch (error: any) {
      console.error("Failed to update roles:", error);
      const errorMessage = error?.message || "Failed to update roles. Please try again.";
      setError(errorMessage);
      showErrorToast("Failed to update roles", errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage User Roles</DialogTitle>
          <DialogDescription>
            Assign or remove roles for "{user?.username}".
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading roles...</div>
        ) : (
          <div className="space-y-6">
            {/* Current Roles Section */}
            {currentRoles.length > 0 && (
              <div className="space-y-2">
                <Label className="font-semibold">Currently Assigned Roles</Label>
                <div className="flex flex-wrap gap-2">
                  {currentRoles.map((role) => (
                    <Badge key={role.id} variant="default" className="flex items-center gap-2">
                      {role.roleName}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {currentRoles.length === 0 && (
              <Alert>
                <AlertDescription>
                  No roles currently assigned
                </AlertDescription>
              </Alert>
            )}

            {/* Role Selector */}
            <div className="space-y-3">
              <Label className="font-semibold">Assign Roles</Label>

              {allRoles.length === 0 ? (
                <Alert>
                  <AlertDescription className="text-yellow-900 text-sm">
                    No roles available on the server
                  </AlertDescription>
                </Alert>
              ) : (
                <MultiSelectCombobox
                  options={allRoles
                    .filter((r) => r.id)
                    .map((r) => ({
                      value: r.id!,
                      label: r.roleName || "Unnamed Role",
                      description: r.roleDesc,
                    }))}
                  value={Array.from(selectedRoleIds)}
                  onChange={(values) => setSelectedRoleIds(new Set(values))}
                  placeholder="Select roles..."
                  disabled={isSubmitting}
                />
              )}
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting || isLoading}
          >
            Close
          </Button>
          <Button
            onClick={handleApplyChanges}
            disabled={isSubmitting || isLoading || allRoles.length === 0 || !hasChanges}
            title={allRoles.length === 0 ? "No roles available" : !hasChanges ? "No changes made" : "Apply role changes"}
          >
            {isSubmitting ? "Applying..." : "Apply Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
