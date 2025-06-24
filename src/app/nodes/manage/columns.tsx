import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";

export type Node = {
  ID: string;
  Hostname: string;
  IpAddress: string;
  IsContainerHost: boolean;
  IsVirtualMachine: boolean;
  IsVmHost: boolean;
  IDDbHost: boolean;
  LastModified?: string;
  Username?: string;
  PublicSshKeyname?: string;
  mappingId?: string;
};

type ActionHandlers = {
  onEdit: (node: Node) => void;
  onDelete: (node: Node) => void;
  onView: (node: Node) => void;
  onAddSshKey: (node: Node) => void;
};

export function getColumns({ onEdit, onDelete, onView, onAddSshKey }: ActionHandlers): ColumnDef<Node>[] {
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
      accessorKey: "Hostname",
      header: "Hostname",
    },
    {
      accessorKey: "IpAddress",
      header: "IP Address",
    },
    {
      accessorKey: "IsContainerHost",
      header: "Type",
      cell: ({ row }) => {
        const types = [];
        if (row.original.IsContainerHost) types.push("Container Host");
        if (row.original.IsVirtualMachine) types.push("Virtual Machine");
        if (row.original.IsVmHost) types.push("VM Host");
        if (row.original.IDDbHost) types.push("DB Host");
        if (types.length === 0) types.push("Physical Server");
        return types.join(", ");
      },
    },
    {
      accessorKey: "Username",
      header: "Username",
    },
    {
      accessorKey: "LastModified",
      header: "Last Modified",
      cell: ({ row }) =>
        row.original.LastModified
          ? new Date(row.original.LastModified).toLocaleDateString()
          : "N/A",
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const node = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onEdit(node)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(node)}>
                Delete
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onView(node)}>
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddSshKey(node)}>
                Add SSH Key
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
} 