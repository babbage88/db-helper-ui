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
import { EthernetPort, WifiOff } from "lucide-react";

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
  pingStatus?: { success: boolean };
};

type ActionHandlers = {
  onEdit: (node: Node) => void;
  onDelete: (node: Node) => void;
  onView: (node: Node) => void;
  onConnect: (node: Node) => void;
  pingStatusMap?: Record<string, { success: boolean; latency: string; error?: string }>;
};

export function getColumns({ onEdit, onDelete, onView, onConnect, pingStatusMap }: ActionHandlers): ColumnDef<Node>[] {
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
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = pingStatusMap ? pingStatusMap[row.original.ID] : undefined;
        if (status === undefined) {
          return (
            <div className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-secondary text-secondary-foreground">
              Checking...
            </div>
          );
        }
        if (status.success) {
          return (
            <div className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-500 text-white">
              <EthernetPort className="h-4 w-4 mr-1" />
              Online
            </div>
          );
        }
        return (
          <div className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-destructive text-white">
            <WifiOff className="h-4 w-4 mr-1" />
            Offline
          </div>
        );
      },
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
              <DropdownMenuItem onClick={() => onConnect(node)}>
                Connect
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
} 