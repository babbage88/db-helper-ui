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

export type Node = {
  ID: number;
  Hostname: string;
  IpAddress: string;
  IsContainerHost: boolean;
  IsVirtualMachine: boolean;
  IsVmHost: boolean;
  IDDbHost: boolean;
  LastModified?: string;
  Username?: string;
  PublicSshKeyname?: string;
};

type ActionHandlers = {
  onEdit: (node: Node) => void;
  onDelete: (node: Node) => void;
  onView: (node: Node) => void;
};

export function getColumns({ onEdit, onDelete, onView }: ActionHandlers): ColumnDef<Node>[] {
  return [
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
      cell: ({ row }) =>
        row.original.IsContainerHost
          ? "Container Host"
          : row.original.IsVirtualMachine
          ? "Virtual Machine"
          : "Physical Server",
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
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
} 