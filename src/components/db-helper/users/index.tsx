"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { UserCrudService } from "@/lib/api/services/UserCrudService";
import type { UserDao } from "@/lib/api/models/UserDao";
import { UserDataTable } from "./user-data-table";
import { CreateUserDialog } from "./create-user-dialog";
import { ResetPasswordDialog } from "./reset-password-dialog";
import { EditUserRoleDialog } from "./edit-user-role-dialog";
import { EmptyState, ErrorState } from "@/components/db-helper/empty-state";
import { TableSkeleton, HeaderSkeleton } from "@/components/db-helper/skeleton-loaders";
import type { UserRow } from "./user-columns";

const parseUserResponse = (response: any): UserRow[] => {
  try {
    // The response might be a string, so parse it first if needed
    let data = response;
    if (typeof response === "string") {
      data = JSON.parse(response);
    }

    console.log("Raw user response:", data);

    // Handle response wrapping - users might be in body or directly in response
    // getAllUsers returns a string via responseHeader, so it might come back as array or wrapped
    const userList = 
      (data as any).body?.users ||
      data.users ||
      (Array.isArray(data) ? data : [data]);

    console.log("Extracted user list:", userList);

    // Map UserDao to UserRow
    const users = Array.isArray(userList) ? userList : [userList];
    return users.map((user: UserDao) => ({
      userId: user.id || "",
      username: user.username || "",
      email: user.email,
      enabled: user.enabled,
      createdAt: user.createdAt,
      roles: user.roles,
    }));
  } catch (error) {
    console.warn("Could not parse user response:", error);
    return [];
  }
};

export function UserManagement() {
  const [users, setUsers] = React.useState<UserRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [resetPasswordUser, setResetPasswordUser] = React.useState<UserRow | null>(null);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = React.useState(false);
  const [editRoleUser, setEditRoleUser] = React.useState<UserRow | null>(null);
  const [editRoleDialogOpen, setEditRoleDialogOpen] = React.useState(false);

  const loadUsers = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await UserCrudService.getAllUsers();
      const parsedUsers = parseUserResponse(response);
      setUsers(parsedUsers);
    } catch (err: any) {
      console.error("Failed to load users:", err);
      setError(err?.message || "Failed to load users");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleResetPasswordClick = (user: UserRow) => {
    setResetPasswordUser(user);
    setResetPasswordDialogOpen(true);
  };

  const handleEditRoleClick = (user: UserRow) => {
    setEditRoleUser(user);
    setEditRoleDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <HeaderSkeleton />
        <TableSkeleton rows={5} columns={6} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Manage user accounts, permissions, and security.
          </p>
        </div>
        <ErrorState
          title="Failed to Load Users"
          description={error}
          onRetry={loadUsers}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pt-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Manage user accounts, permissions, and security.
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} size="lg" className="gap-2">
          <Plus className="h-4 w-4" />
          Create User
        </Button>
      </div>

      {users.length === 0 ? (
        <EmptyState
          title="No Users Yet"
          description="Create your first user account to get started with user management."
          actionLabel="Create User"
          onAction={() => setCreateDialogOpen(true)}
        />
      ) : (
        <UserDataTable 
          data={users} 
          onChange={loadUsers}
          onResetPassword={handleResetPasswordClick}
          onEditRole={handleEditRoleClick}
        />
      )}

      <CreateUserDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={loadUsers}
      />

      <ResetPasswordDialog
        open={resetPasswordDialogOpen}
        user={resetPasswordUser}
        onOpenChange={setResetPasswordDialogOpen}
        onSuccess={loadUsers}
      />

      <EditUserRoleDialog
        open={editRoleDialogOpen}
        user={editRoleUser}
        onOpenChange={setEditRoleDialogOpen}
        onSuccess={loadUsers}
      />
    </div>
  );
}
