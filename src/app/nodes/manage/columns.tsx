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
import { Badge } from "@/components/ui/badge";
import { EthernetPort, WifiOff } from "lucide-react";
import type { HostResourceStats } from "@/lib/host-stats-api";

export type Node = {
  ID: string;
  Hostname: string;
  IpAddress: string;
  hostServerTypeIds: string[]; // ids for editing
  hostServerTypeNames: string[]; // names for display
  platformTypeIds: string[]; // ids for editing
  platformTypeNames: string[]; // names for display
  LastModified?: string;
  Username?: string;
  PublicSshKeyname?: string;
  mappingId?: string;
  pingStatus?: { success: boolean };
  stats?: HostResourceStats;
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
      size: 44,
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
      size: 180,
      cell: ({ row }) => (
        <div className="max-w-[180px] truncate font-medium" title={row.original.Hostname}>
          {row.original.Hostname || "-"}
        </div>
      ),
    },
    {
      accessorKey: "IpAddress",
      header: "IP Address",
      size: 132,
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.original.IpAddress || "-"}
        </span>
      ),
    },
    {
      accessorKey: "hostServerTypeNames",
      header: "Type",
      size: 260,
      cell: ({ row }) => {
        const types = row.original.hostServerTypeNames || [];
        return <CompactBadgeList items={types} empty="Unclassified" maxVisible={2} />;
      },
    },
    {
      accessorKey: "platformTypeNames",
      header: "Platform",
      size: 280,
      cell: ({ row }) => {
        const plats = row.original.platformTypeNames || [];
        return <CompactBadgeList items={plats} empty="No platform" maxVisible={2} />;
      },
    },
    {
      accessorKey: "Username",
      header: "Username",
      size: 140,
      cell: ({ row }) => (
        <span className="max-w-[140px] truncate font-mono text-xs" title={row.original.Username}>
          {row.original.Username || "-"}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      size: 132,
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
      size: 128,
      cell: ({ row }) =>
        row.original.LastModified
          ? new Date(row.original.LastModified).toLocaleDateString()
          : "N/A",
    },
    {
      id: "actions",
      size: 56,
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

function CompactBadgeList({
  items,
  empty,
  maxVisible,
}: {
  items: string[];
  empty: string;
  maxVisible: number;
}) {
  const visible = items.slice(0, maxVisible);
  const hiddenCount = Math.max(items.length - visible.length, 0);

  if (!items.length) {
    return <span className="text-muted-foreground">{empty}</span>;
  }

  return (
    <div
      className="flex max-w-[280px] items-center gap-1 overflow-hidden"
      title={items.join(", ")}
    >
      {visible.map((item) => (
        <Badge
          key={item}
          variant="secondary"
          className="max-w-[120px] truncate rounded-md px-2 py-0.5 font-normal"
        >
          {item}
        </Badge>
      ))}
      {hiddenCount > 0 && (
        <Badge variant="outline" className="shrink-0 rounded-md px-2 py-0.5 font-normal">
          +{hiddenCount}
        </Badge>
      )}
    </div>
  );
}
