import type { ColumnDef } from "@tanstack/react-table";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export type UserRow = {
  userId: string;
  username: string;
  email?: string;
  enabled?: boolean;
  createdAt?: string;
  roles?: string[];
};

type ActionHandlers = {
  onEdit: (user: UserRow) => void;
  onDelete: (user: UserRow) => void;
  onToggleStatus: (user: UserRow) => void;
  onResetPassword: (user: UserRow) => void;
};

// Action cell component with state management for dropdown
function ActionCell({
  user,
  onEdit,
  onDelete,
  onToggleStatus,
  onResetPassword,
}: {
  user: UserRow;
  onEdit: (user: UserRow) => void;
  onDelete: (user: UserRow) => void;
  onToggleStatus: (user: UserRow) => void;
  onResetPassword: (user: UserRow) => void;
}) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleEdit = () => {
    onEdit(user);
    setIsOpen(false);
  };

  const handleResetPassword = () => {
    onResetPassword(user);
    setIsOpen(false);
  };

  const handleToggleStatus = () => {
    onToggleStatus(user);
    setIsOpen(false);
  };

  const handleDelete = () => {
    onDelete(user);
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={handleEdit}>Assign Role</DropdownMenuItem>
        <DropdownMenuItem onClick={handleResetPassword}>
          Reset Password
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleToggleStatus}>
          {user.enabled ? "Disable User" : "Enable User"}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleDelete}
          className="text-red-600"
        >
          Delete User
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function getColumns({
  onEdit,
  onDelete,
  onToggleStatus,
  onResetPassword,
}: ActionHandlers): ColumnDef<UserRow>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "username",
      header: "Username",
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => row.original.email || "—",
    },
    {
      accessorKey: "enabled",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.enabled ? "default" : "secondary"}>
          {row.original.enabled ? "Enabled" : "Disabled"}
        </Badge>
      ),
    },
    {
      accessorKey: "roles",
      header: "Roles",
      cell: ({ row }) => {
        const roles = row.original.roles;
        if (!roles || roles.length === 0) {
          return "—";
        }
        return (
          <div className="flex flex-wrap gap-1">
            {roles.map((role) => (
              <Badge key={role} variant="outline">
                {role}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) =>
        row.original.createdAt
          ? new Date(row.original.createdAt).toLocaleDateString()
          : "N/A",
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <ActionCell
            user={user}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleStatus={onToggleStatus}
            onResetPassword={onResetPassword}
          />
        );
      },
    },
  ];
}
