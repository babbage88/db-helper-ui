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

export type RoleRow = {
  id: string;
  roleName: string;
  roleDesc?: string;
  enabled?: boolean;
  createdAt?: string;
  permissionCount?: number;
};

type ActionHandlers = {
  onEdit: (role: RoleRow) => void;
  onDelete: (role: RoleRow) => void;
  onManagePermissions: (role: RoleRow) => void;
};

// Action cell component with state management for dropdown
function ActionCell({
  role,
  onEdit,
  onDelete,
  onManagePermissions,
}: {
  role: RoleRow;
  onEdit: (role: RoleRow) => void;
  onDelete: (role: RoleRow) => void;
  onManagePermissions: (role: RoleRow) => void;
}) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleEdit = () => {
    onEdit(role);
    setIsOpen(false);
  };

  const handleManagePermissions = () => {
    onManagePermissions(role);
    setIsOpen(false);
  };

  const handleDelete = () => {
    onDelete(role);
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
        <DropdownMenuItem onClick={handleEdit}>Edit Role</DropdownMenuItem>
        <DropdownMenuItem onClick={handleManagePermissions}>
          Manage Permissions
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDelete} className="text-red-600">
          Delete Role
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function getColumns({
  onEdit,
  onDelete,
  onManagePermissions,
}: ActionHandlers): ColumnDef<RoleRow>[] {
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
      accessorKey: "roleName",
      header: "Name",
    },
    {
      accessorKey: "roleDesc",
      header: "Description",
      cell: ({ row }) => row.original.roleDesc || "—",
    },
    {
      accessorKey: "permissionCount",
      header: "Permissions",
      cell: ({ row }) => {
        const count = row.original.permissionCount || 0;
        return <Badge variant="outline">{count}</Badge>;
      },
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
        const role = row.original;
        return (
          <ActionCell
            role={role}
            onEdit={onEdit}
            onDelete={onDelete}
            onManagePermissions={onManagePermissions}
          />
        );
      },
    },
  ];
}
