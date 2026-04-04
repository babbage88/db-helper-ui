"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { RolesCrudService } from "@/lib/api/services/RolesCrudService";
import type { UserRoleDao } from "@/lib/api/models/UserRoleDao";
import { RoleDataTable } from "./role-data-table";
import { CreateRoleDialog } from "./create-role-dialog";
import { ManageRolePermissionsDialog } from "./manage-role-permissions-dialog";
import type { RoleRow } from "./role-columns";

const parseRoleResponse = (response: any): RoleRow[] => {
  try {
    // The response might be a string or an object with userRoles array
    let data = response;
    if (typeof response === "string") {
      data = JSON.parse(response);
    }

    console.log("Raw role response:", data);

    // Map UserRoleDao to RoleRow
    // Handle response structure - roles might be in body.userRoles or just userRoles
    const roleList = 
      (data as any).body?.userRoles || 
      data.userRoles || 
      (Array.isArray(data) ? data : []);

    console.log("Extracted role list:", roleList);

    return roleList.map((role: UserRoleDao) => ({
      id: role.id || "",
      roleName: role.roleName || "",
      roleDesc: role.roleDesc,
      enabled: role.enabled,
      createdAt: role.createdAt,
      permissionCount: 0, // This would need to be populated from role-permission mappings
    }));
  } catch (error) {
    console.warn("Could not parse role response:", error);
    console.log("Full response object:", response);
    return [];
  }
};

export function RoleManagement() {
  const [roles, setRoles] = React.useState<RoleRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [managePermissionsRole, setManagePermissionsRole] = React.useState<RoleRow | null>(null);
  const [managePermissionsDialogOpen, setManagePermissionsDialogOpen] = React.useState(false);

  const loadRoles = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await RolesCrudService.getAllUserRoles();
      const parsedRoles = parseRoleResponse(response);
      setRoles(parsedRoles);
    } catch (err: any) {
      console.error("Failed to load roles:", err);
      setError(err?.message || "Failed to load roles");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  const handleManagePermissionsClick = (role: RoleRow) => {
    setManagePermissionsRole(role);
    setManagePermissionsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-muted-foreground">Loading roles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Role Management</h2>
          <p className="text-muted-foreground">
            Create and manage roles, assign permissions to roles, and control user access.
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Role
        </Button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          <p className="font-medium">Error loading roles</p>
          <p>{error}</p>
        </div>
      )}

      <RoleDataTable
        data={roles}
        onChange={loadRoles}
        onEdit={() => {}} // Edit dialog can be implemented in future
        onManagePermissions={handleManagePermissionsClick}
      />

      <CreateRoleDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={loadRoles}
      />

      <ManageRolePermissionsDialog
        open={managePermissionsDialogOpen}
        role={managePermissionsRole}
        onOpenChange={setManagePermissionsDialogOpen}
        onSuccess={loadRoles}
      />
    </div>
  );
}
