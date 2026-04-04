"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { UserCrudService } from "@/lib/api/services/UserCrudService";
import type { UserDao } from "@/lib/api/models/UserDao";
import { UserDataTable } from "./user-data-table";
import { CreateUserDialog } from "./create-user-dialog";
import { ResetPasswordDialog } from "./reset-password-dialog";
import type { UserRow } from "./user-columns";

const parseUserResponse = (response: any): UserRow[] => {
  try {
    // The response might be a string, so parse it first if needed
    let data = response;
    if (typeof response === "string") {
      data = JSON.parse(response);
    }

    // Map UserDao to UserRow
    const users = Array.isArray(data) ? data : [data];
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-muted-foreground">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">
            Manage user accounts, permissions, and security.
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create User
        </Button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          <p className="font-medium">Error loading users</p>
          <p>{error}</p>
        </div>
      )}

      <UserDataTable 
        data={users} 
        onChange={loadUsers}
        onResetPassword={handleResetPasswordClick}
      />

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
    </div>
  );
}
