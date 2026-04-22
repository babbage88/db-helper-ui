"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
  type ColumnFiltersState,
  type RowSelectionState,
} from "@tanstack/react-table";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, ChevronRight, RefreshCw, Filter, Cpu, HardDrive, MemoryStick, Server, ShieldCheck, UserRound } from "lucide-react";
import { getColumns, type Node } from "./columns";
import { HostServersService } from "@/lib/api/services/HostServersService";
import type { HostServerType } from "@/lib/api/models/HostServerType";
import type { PlatformType } from "@/lib/api/models/PlatformType";
import type { UpdateHostServerRequest } from "@/lib/api/models/UpdateHostServerRequest";
import { Label } from "@/components/ui/label";
import { SecretsService } from "@/lib/api/services/SecretsService";
import { SshKeyHostMappingsService } from "@/lib/api/services/SshKeyHostMappingsService";
import type { CreateSshKeyHostMappingResponse } from "@/lib/api/models/CreateSshKeyHostMappingResponse";
import { NetworkPingService } from "@/lib/api/services/NetworkPingService";
import { TerminalComponent } from "@/app/nodes/manage/terminal/terminal";
import { formatBytes } from "@/lib/s3-admin-api";
import ReactSelect from 'react-select';
import type { MultiValue } from 'react-select';

interface DataTableProps {
  data: Node[];
  onChange?: () => void; // callback to refetch data after CRUD
}

interface NodeDetails extends Node {
  sshKeyHostMappings?: CreateSshKeyHostMappingResponse[];
}

export function DataTable({ data, onChange }: DataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [viewNode, setViewNode] = React.useState<Node | null>(null);
  const [viewNodeDetails, setViewNodeDetails] = React.useState<NodeDetails | null>(null);
  const [isViewLoading, setIsViewLoading] = React.useState(false);
  const [editNode, setEditNode] = React.useState<Node | null>(null);
  const [deleteNode, setDeleteNode] = React.useState<Node | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = React.useState(false);
  const [pingStatusMap, setPingStatusMap] = React.useState<Record<string, { success: boolean; latency: string; error?: string }>>({});
  const [isPinging, setIsPinging] = React.useState(false);
  const [terminalNode, setTerminalNode] = React.useState<Node | null>(null); // For Terminal modal

  // Ping all nodes to check their status (update as each finishes)
  const pingNodes = React.useCallback(async (nodes: Node[]) => {
    setIsPinging(true);
    await Promise.all(
      nodes.map(async (node) => {
        try {
          const pingResponse = await NetworkPingService.pingHostServer({
            hostServerId: node.ID
          });
          setPingStatusMap((prev) => ({
            ...prev,
            [node.ID]: {
              success: pingResponse.success,
              latency: pingResponse.latency,
              error: pingResponse.error
            }
          }));
        } catch (error) {
          setPingStatusMap((prev) => ({
            ...prev,
            [node.ID]: {
              success: false,
              latency: "0ms",
              error: "Ping failed"
            }
          }));
        }
      })
    );
    setIsPinging(false);
  }, []);

  // Update ping status when data changes
  React.useEffect(() => {
    if (data.length > 0) {
      // Reset pingStatusMap for new data
      setPingStatusMap({});
      pingNodes(data);
    } else {
      setPingStatusMap({});
    }
  }, [data, pingNodes]);

  // Periodic refresh every 30 seconds
  React.useEffect(() => {
    if (data.length === 0) return;
    const interval = setInterval(() => {
      pingNodes(data);
    }, 30000);
    return () => clearInterval(interval);
  }, [data, pingNodes]);

  // Handlers
  const handleEdit = (node: Node) => setEditNode(node);
  const handleView = async (node: Node) => {
    setViewNode(node);
    setIsViewLoading(true);
    try {
      const mappings = await SshKeyHostMappingsService.getSshKeyHostMappingsByHostId(node.ID.toString());
      setViewNodeDetails({ ...node, sshKeyHostMappings: mappings });
    } catch (error) {
      console.error("Failed to fetch SSH key mappings:", error);
      setViewNodeDetails(node); // Show at least the basic node info
    } finally {
      setIsViewLoading(false);
    }
  };
  const handleDelete = (node: Node) => setDeleteNode(node);
  const handleConnect = (node: Node) => setTerminalNode(node);

  const confirmDeleteMapping = async () => {
    if (!deleteNode || !deleteNode.mappingId) return;
    setIsDeleting(true);
    try {
      await SshKeyHostMappingsService.deleteSshKeyHostMapping(deleteNode.mappingId);
      setDeleteNode(null);
      if (onChange) onChange();
    } catch (e) {
      console.error("Failed to delete mapping:", e);
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmDeleteNode = async () => {
    if (!deleteNode) return;
    setIsDeleting(true);
    try {
      await HostServersService.deleteHostServer(deleteNode.ID.toString());
      setDeleteNode(null);
      if (onChange) onChange();
    } catch (e) {
      console.error("Failed to delete node:", e);
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = React.useMemo(() => getColumns({
    onEdit: handleEdit,
    onDelete: handleDelete,
    onView: handleView,
    onConnect: handleConnect,
    pingStatusMap, // pass the map for use in columns
  }), [pingStatusMap]);

  const table = useReactTable({
    data, // always use the original data
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      rowSelection,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, _columnId, filterValue) => {
      return Object.values(row.original).some((value) =>
        String(value ?? "").toLowerCase().includes(String(filterValue).toLowerCase())
      );
    },
    enableRowSelection: true,
  });

  const numSelected = Object.keys(rowSelection).length;

  const confirmBulkDelete = async () => {
    setIsDeleting(true);
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const idsToDelete = selectedRows.map(row => row.original.ID);
    try {
      await Promise.all(idsToDelete.map(id => HostServersService.deleteHostServer(id)));
      if (onChange) onChange();
      setRowSelection({});
    } catch (e) {
      console.error("Failed to bulk delete nodes:", e);
    } finally {
      setIsDeleting(false);
      setIsBulkDeleteConfirmOpen(false);
    }
  };

  const confirmBulkDeleteMappings = async () => {
    setIsDeleting(true);
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const mappingsToDelete = selectedRows
      .map(row => row.original.mappingId)
      .filter(mappingId => mappingId); // Only delete rows that have mappings
    try {
      await Promise.all(mappingsToDelete.map(mappingId => SshKeyHostMappingsService.deleteSshKeyHostMapping(mappingId!)));
      if (onChange) onChange();
      setRowSelection({});
    } catch (e) {
      console.error("Failed to bulk delete mappings:", e);
    } finally {
      setIsDeleting(false);
      setIsBulkDeleteConfirmOpen(false);
    }
  };

  return (
    <div className="w-full px-2 sm:px-0">
      {/* Responsive Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 py-4">
        <div className="flex-1 min-w-0">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter nodes..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-10 w-full sm:max-w-sm"
            />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => pingNodes(data)}
            disabled={isPinging}
            className="w-full sm:w-auto"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isPinging ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isPinging ? 'Pinging...' : 'Refresh Status'}</span>
            <span className="sm:hidden">{isPinging ? 'Pinging...' : 'Refresh'}</span>
          </Button>
          {numSelected > 0 && (
            <Button
              variant="destructive"
              onClick={() => setIsBulkDeleteConfirmOpen(true)}
              className="w-full sm:w-auto"
            >
              Delete Selected ({numSelected})
            </Button>
          )}
        </div>
      </div>

      {/* Responsive Table Container */}
      <div className="rounded-md border overflow-hidden w-full">
        <div className="overflow-x-auto w-full">
          <Table className="w-full min-w-[1100px] table-fixed">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead 
                      key={header.id} 
                      colSpan={header.colSpan}
                      className="whitespace-nowrap"
                      style={{ width: header.getSize() }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell 
                        key={cell.id}
                        className="whitespace-nowrap align-middle"
                        style={{ width: cell.column.getSize() }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={table.getAllColumns().length} className="h-24 text-center">
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Responsive Pagination */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4">
        <div className="flex-1 text-sm text-muted-foreground text-center sm:text-left">
          {numSelected} of {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex items-center justify-center sm:justify-end space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="w-10 h-10 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm text-muted-foreground px-2">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="w-10 h-10 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Responsive Bulk Delete Confirmation Dialog */}
      {isBulkDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-2 sm:p-4">
          <div className="bg-card p-2 sm:p-6 rounded shadow-lg w-full sm:max-w-md sm:mx-auto">
            <h2 className="font-bold mb-2 text-lg">Delete Selected Nodes</h2>
            <p className="mb-4">Are you sure you want to delete {numSelected} selected node(s)?</p>
            <p className="text-sm text-muted-foreground mb-4">
              You can either remove your access to these nodes or delete the nodes for all users.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="destructive" onClick={confirmBulkDelete} disabled={isDeleting} className="w-full sm:w-auto">
                {isDeleting ? "Deleting..." : "Delete Nodes Completely"}
              </Button>
              <Button variant="secondary" onClick={confirmBulkDeleteMappings} disabled={isDeleting} className="w-full sm:w-auto">
                {isDeleting ? "Deleting..." : "Delete My Access Only"}
              </Button>
              <Button variant="outline" onClick={() => setIsBulkDeleteConfirmOpen(false)} disabled={isDeleting} className="w-full sm:w-auto">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Responsive View Modal */}
      {viewNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-2 sm:p-4">
          <div className="w-full max-h-[92vh] overflow-y-auto rounded-lg border bg-card p-4 shadow-xl sm:max-w-4xl sm:p-6">
            {isViewLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                Loading...
              </div>
            ) : (
              <NodeDetailsPanel
                node={viewNodeDetails || viewNode}
                pingStatus={pingStatusMap[viewNode.ID]}
              />
            )}
            <div className="mt-6 flex justify-end">
              <Button onClick={() => { setViewNode(null); setViewNodeDetails(null); }}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Responsive Delete Confirm Modal */}
      {deleteNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-2 sm:p-4">
          <div className="bg-card p-2 sm:p-6 rounded shadow-lg w-full sm:max-w-md sm:mx-auto">
            <h2 className="font-bold mb-2 text-lg">Delete Node</h2>
            <p className="mb-4">Are you sure you want to delete <b>{deleteNode.Hostname}</b>?</p>
            <p className="text-sm text-muted-foreground mb-4">
              You can either remove your access to this node or delete the node for all users.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="destructive" onClick={confirmDeleteNode} disabled={isDeleting} className="w-full sm:w-auto">
                {isDeleting ? "Deleting..." : "Delete Node Completely"}
              </Button>
              <Button variant="secondary" onClick={confirmDeleteMapping} disabled={isDeleting || !deleteNode.mappingId} className="w-full sm:w-auto">
                {isDeleting ? "Deleting..." : "Delete My Access Only"}
              </Button>
              <Button variant="outline" onClick={() => setDeleteNode(null)} disabled={isDeleting} className="w-full sm:w-auto">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Responsive Edit Modal */}
      {editNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-2 sm:p-4">
          <div className="bg-card p-2 sm:p-6 rounded shadow-lg w-full sm:max-w-2xl sm:mx-auto max-h-[90vh] overflow-y-auto">
            <h2 className="font-bold mb-2 text-lg">Edit Node</h2>
            <EditNodeForm
              node={editNode}
              onCancel={() => setEditNode(null)}
              onSuccess={() => {
                setEditNode(null);
                if (onChange) onChange();
              }}
            />
          </div>
        </div>
      )}

      {/* Terminal Modal */}
      {terminalNode && (
        <TerminalComponent
          nodeId={terminalNode.ID}
          hostname={terminalNode.Hostname}
          ipAddress={terminalNode.IpAddress}
          username={terminalNode.Username || "root"}
          onClose={() => setTerminalNode(null)}
          term="xterm-256color" // You can change this to any term type you want
        />
      )}
    </div>
  );
}

function NodeDetailsPanel({
  node,
  pingStatus,
}: {
  node: NodeDetails;
  pingStatus?: { success: boolean; latency: string; error?: string };
}) {
  const stats = node.stats;
  const usedMemory =
    stats?.memoryTotalBytes !== undefined && stats?.memoryAvailableBytes !== undefined
      ? Math.max(stats.memoryTotalBytes - stats.memoryAvailableBytes, 0)
      : undefined;
  const usedStorage =
    stats?.storageTotalBytes !== undefined && stats?.storageAvailableBytes !== undefined
      ? Math.max(stats.storageTotalBytes - stats.storageAvailableBytes, 0)
      : undefined;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-2xl font-semibold tracking-tight">
              {node.Hostname || "Unnamed node"}
            </h2>
            <StatusBadge status={pingStatus} />
          </div>
          <p className="mt-1 font-mono text-sm text-muted-foreground">
            {node.IpAddress || "No IP address"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="rounded-md">
            {stats?.capacityRole ? formatCapacityRole(stats.capacityRole) : "No capacity role"}
          </Badge>
          <Badge variant="secondary" className="rounded-md">
            {node.Username || "No username"}
          </Badge>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ResourceStat
          icon={Cpu}
          label="CPU"
          value={stats?.cpuCores !== undefined ? `${stats.cpuCores.toLocaleString()} cores` : "Unavailable"}
        />
        <ResourceStat
          icon={MemoryStick}
          label="Memory"
          value={stats?.memoryTotalBytes !== undefined ? formatBytes(stats.memoryTotalBytes) : "Unavailable"}
          detail={
            usedMemory !== undefined && stats?.memoryAvailableBytes !== undefined
              ? `${formatBytes(usedMemory)} used, ${formatBytes(stats.memoryAvailableBytes)} available`
              : undefined
          }
        />
        <ResourceStat
          icon={HardDrive}
          label="Storage"
          value={stats?.storageTotalBytes !== undefined ? formatBytes(stats.storageTotalBytes) : "Unavailable"}
          detail={
            usedStorage !== undefined && stats?.storageAvailableBytes !== undefined
              ? `${formatBytes(usedStorage)} used, ${formatBytes(stats.storageAvailableBytes)} available`
              : undefined
          }
        />
        <ResourceStat
          icon={Server}
          label="Telemetry"
          value={stats?.status === "ok" ? "Collected" : stats?.status === "error" ? "Error" : "Unavailable"}
          detail={stats?.collectedAt ? new Date(stats.collectedAt).toLocaleString() : stats?.error}
        />
      </div>

      <Separator />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <section className="space-y-4">
          <h3 className="text-sm font-semibold">Identity</h3>
          <div className="grid gap-3 rounded-md border p-4">
            <DetailItem label="Node ID" value={shortId(node.ID)} title={node.ID} />
            <DetailItem label="Hostname" value={node.Hostname || "-"} />
            <DetailItem label="IP Address" value={node.IpAddress || "-"} />
            <DetailItem label="Username" value={node.Username || "-"} />
            <DetailItem
              label="Last Modified"
              value={node.LastModified ? new Date(node.LastModified).toLocaleString() : "N/A"}
            />
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold">Classifications</h3>
          <div className="space-y-4 rounded-md border p-4">
            <BadgeGroup title="Host types" items={node.hostServerTypeNames} empty="No host types assigned" />
            <BadgeGroup title="Platforms" items={node.platformTypeNames} empty="No platforms assigned" />
          </div>
        </section>
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">SSH Access Mappings</h3>
        </div>
        {node.sshKeyHostMappings?.length ? (
          <div className="overflow-hidden rounded-md border">
            <div className="grid grid-cols-[1fr_1fr_1fr] gap-3 border-b bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground">
              <span>User</span>
              <span>SSH Key</span>
              <span>Last Modified</span>
            </div>
            {node.sshKeyHostMappings.map((mapping) => (
              <div
                key={mapping.id}
                className="grid grid-cols-[1fr_1fr_1fr] gap-3 border-b px-4 py-3 text-sm last:border-b-0"
              >
                <span className="min-w-0 truncate">
                  <UserRound className="mr-2 inline h-3.5 w-3.5 text-muted-foreground" />
                  {mapping.hostserverUsername || "-"}
                </span>
                <span className="min-w-0 truncate font-mono text-xs" title={mapping.sshKeyId}>
                  {shortId(mapping.sshKeyId)}
                </span>
                <span className="min-w-0 truncate text-muted-foreground">
                  {mapping.lastModified ? new Date(mapping.lastModified).toLocaleString() : "N/A"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-dashed p-5 text-sm text-muted-foreground">
            No SSH mappings were returned for this node.
          </div>
        )}
      </section>
    </div>
  );
}

function ResourceStat({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="rounded-md border p-4">
      <div className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <div className="mt-2 text-lg font-semibold">{value}</div>
      {detail && <div className="mt-1 text-xs text-muted-foreground">{detail}</div>}
    </div>
  );
}

function DetailItem({
  label,
  value,
  title,
}: {
  label: string;
  value: string;
  title?: string;
}) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate font-medium" title={title || value}>
        {value}
      </span>
    </div>
  );
}

function BadgeGroup({
  title,
  items,
  empty,
}: {
  title: string;
  items: string[];
  empty: string;
}) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-medium uppercase text-muted-foreground">{title}</div>
      {items.length ? (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <Badge key={item} variant="secondary" className="rounded-md">
              {item}
            </Badge>
          ))}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">{empty}</div>
      )}
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status?: { success: boolean; latency: string; error?: string };
}) {
  if (!status) {
    return <Badge variant="secondary" className="rounded-md">Checking</Badge>;
  }

  if (status.success) {
    return <Badge className="rounded-md bg-green-500 text-white hover:bg-green-500">Online</Badge>;
  }

  return (
    <Badge variant="destructive" className="rounded-md" title={status.error}>
      Offline
    </Badge>
  );
}

function shortId(value?: string) {
  if (!value) return "-";
  return value.length > 12 ? `${value.slice(0, 8)}...${value.slice(-4)}` : value;
}

function formatCapacityRole(role: string) {
  switch (role) {
    case "physical":
      return "Physical capacity";
    case "hypervisor":
      return "Hypervisor capacity";
    case "guest":
      return "VM/LXC guest";
    default:
      return "Unclassified";
  }
}

function EditNodeForm({ node, onCancel, onSuccess }: {
  node: Node;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = React.useState({
    Hostname: node.Hostname,
    IpAddress: node.IpAddress,
    Username: node.Username || "",
    SshPrivateKey: "",
    SudoPassword: "",
    hostServerTypeIds: node.hostServerTypeIds || [],
    platformTypeIds: node.platformTypeIds || [],
  });
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [hostServerTypes, setHostServerTypes] = React.useState<HostServerType[]>([]);
  const [platformTypes, setPlatformTypes] = React.useState<PlatformType[]>([]);
  const [isLoadingTypes, setIsLoadingTypes] = React.useState(true);

  // Update form state if node changes (e.g., when opening modal for a different node)
  React.useEffect(() => {
    setForm({
      Hostname: node.Hostname,
      IpAddress: node.IpAddress,
      Username: node.Username || "",
      SshPrivateKey: "",
      SudoPassword: "",
      hostServerTypeIds: node.hostServerTypeIds || [],
      platformTypeIds: node.platformTypeIds || [],
    });
  }, [node]);

  React.useEffect(() => {
    setIsLoadingTypes(true);
    Promise.all([
      HostServersService.getAllHostServerTypes(),
      HostServersService.getAllPlatformTypes(),
    ]).then(([hst, plt]) => {
      setHostServerTypes(hst);
      setPlatformTypes(plt);
      setIsLoadingTypes(false);
    }).catch(() => {
      setHostServerTypes([]);
      setPlatformTypes([]);
      setIsLoadingTypes(false);
    });
  }, []);

  // Debug logging
  React.useEffect(() => {
    console.log('DEBUG: form.hostServerTypeIds', form.hostServerTypeIds);
    console.log('DEBUG: form.platformTypeIds', form.platformTypeIds);
    console.log('DEBUG: hostServerTypes', hostServerTypes);
    console.log('DEBUG: platformTypes', platformTypes);
  }, [form, hostServerTypes, platformTypes]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // File input handler for secrets
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setForm((prev) => ({ ...prev, [name]: event.target?.result as string }));
      };
      reader.readAsText(files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      let sshKeyId: string | undefined = undefined;
      let sudoPasswordId: string | undefined = undefined;
      // Create SSH Key secret if provided
      if (form.SshPrivateKey) {
        const secretRes = await SecretsService.createUserSecret({ secret: form.SshPrivateKey });
        sshKeyId = secretRes.id;
      }
      // Create Sudo Password secret if provided
      if (form.SudoPassword) {
        const secretRes = await SecretsService.createUserSecret({ secret: form.SudoPassword });
        sudoPasswordId = secretRes.id;
      }
      const updateRequest: UpdateHostServerRequest = {
        hostname: form.Hostname,
        username: form.Username,
        ssh_key_id: sshKeyId,
        sudo_password_token_id: sudoPasswordId,
        host_server_type_ids: form.hostServerTypeIds,
        platform_type_ids: form.platformTypeIds,
      };

      if (form.IpAddress.trim()) {
        updateRequest.ip_address = form.IpAddress.trim();
      } else {
        updateRequest.clear_ip_address = true;
      }

      await HostServersService.updateHostServer(node.ID.toString(), updateRequest);
      // Create host server type mappings
      await Promise.all(
        form.hostServerTypeIds.map(typeId =>
          HostServersService.createHostServerTypeMapping({ hostServerId: node.ID, hostServerTypeId: typeId })
        )
      );
      // Create platform type mappings (cross-product)
      await Promise.all(
        form.hostServerTypeIds.flatMap(hostTypeId =>
          form.platformTypeIds.map(platformTypeId =>
            HostServersService.createPlatformTypeMapping({ hostServerId: node.ID, hostServerTypeId: hostTypeId, platformTypeId })
          )
        )
      );
      onSuccess();
    } catch (e: any) {
      setError(e?.message || "Failed to update node");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Hostname</label>
          <input
            className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            name="Hostname"
            value={form.Hostname}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">IP Address</label>
          <input
            className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            name="IpAddress"
            value={form.IpAddress}
            onChange={handleChange}
            placeholder="Optional"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Username</label>
        <input
          className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          name="Username"
          value={form.Username}
          onChange={handleChange}
        />
      </div>
      <div>
        <Label className="block text-sm font-medium mb-1">Host Server Types</Label>
        {isLoadingTypes ? (
          <div className="text-muted-foreground text-sm">Loading host server types...</div>
        ) : (
          <ReactSelect
            isMulti
            options={hostServerTypes.map(type => ({ value: type.id, label: type.name }))}
            value={hostServerTypes
              .filter(type => form.hostServerTypeIds.includes(type.id))
              .map(type => ({ value: type.id, label: type.name })) as any}
            onChange={(selected: MultiValue<{ value: string; label: string }>) =>
              setForm(prev => ({ ...prev, hostServerTypeIds: selected.map(option => option.value) }))
            }
            classNamePrefix="react-select"
            placeholder="Select host server types..."
            theme={theme => ({
              ...theme,
              borderRadius: 6,
              colors: {
                ...theme.colors,
                primary25: '#22223b',
                primary: '#4f46e5',
                neutral0: '#18181b',
                neutral80: '#f4f4f5',
                neutral20: '#27272a',
                neutral30: '#4f46e5',
              },
            })}
            styles={{
              input: (base) => ({
                ...base,
                color: '#f4f4f5',
                fontFamily: 'inherit',
              }),
              singleValue: (base) => ({
                ...base,
                color: '#f4f4f5',
                fontFamily: 'inherit',
              }),
              multiValue: (base) => ({
                ...base,
                backgroundColor: '#27272a',
                color: '#f4f4f5',
                fontFamily: 'inherit',
              }),
              menu: (base) => ({
                ...base,
                backgroundColor: '#18181b',
                color: '#f4f4f5',
                fontFamily: 'inherit',
              }),
              option: (base, state) => ({
                ...base,
                backgroundColor: state.isFocused ? '#22223b' : '#18181b',
                color: '#f4f4f5',
                fontFamily: 'inherit',
              }),
            }}
          />
        )}
      </div>
      <div>
        <Label className="block text-sm font-medium mb-1">Platform Types</Label>
        {isLoadingTypes ? (
          <div className="text-muted-foreground text-sm">Loading platform types...</div>
        ) : (
          <ReactSelect
            isMulti
            options={platformTypes.map(type => ({ value: type.id, label: type.name }))}
            value={platformTypes
              .filter(type => form.platformTypeIds.includes(type.id))
              .map(type => ({ value: type.id, label: type.name })) as any}
            onChange={(selected: MultiValue<{ value: string; label: string }>) =>
              setForm(prev => ({ ...prev, platformTypeIds: selected.map(option => option.value) }))
            }
            classNamePrefix="react-select"
            placeholder="Select platform types..."
            theme={theme => ({
              ...theme,
              borderRadius: 6,
              colors: {
                ...theme.colors,
                primary25: '#22223b',
                primary: '#4f46e5',
                neutral0: '#18181b',
                neutral80: '#f4f4f5',
                neutral20: '#27272a',
                neutral30: '#4f46e5',
              },
            })}
            styles={{
              input: (base) => ({
                ...base,
                color: '#f4f4f5',
                fontFamily: 'inherit',
              }),
              singleValue: (base) => ({
                ...base,
                color: '#f4f4f5',
                fontFamily: 'inherit',
              }),
              multiValue: (base) => ({
                ...base,
                backgroundColor: '#27272a',
                color: '#f4f4f5',
                fontFamily: 'inherit',
              }),
              menu: (base) => ({
                ...base,
                backgroundColor: '#18181b',
                color: '#f4f4f5',
                fontFamily: 'inherit',
              }),
              option: (base, state) => ({
                ...base,
                backgroundColor: state.isFocused ? '#22223b' : '#18181b',
                color: '#f4f4f5',
                fontFamily: 'inherit',
              }),
            }}
          />
        )}
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">SSH Private Key</label>
        <textarea
          className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[100px] resize-y"
          name="SshPrivateKey"
          value={form.SshPrivateKey}
          onChange={(e) => setForm(prev => ({ ...prev, SshPrivateKey: e.target.value }))}
          placeholder="Paste private key content here..."
        />
        <div className="mt-2">
          <input
            type="file"
            accept=".pem,.key,.txt"
            name="SshPrivateKey"
            onChange={handleFileChange}
            className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Sudo Password</label>
        <input
          className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          name="SudoPassword"
          type="password"
          value={form.SudoPassword}
          onChange={handleChange}
          placeholder="Enter sudo password"
        />
        <div className="mt-2">
          <input
            type="file"
            accept=".txt"
            name="SudoPassword"
            onChange={handleFileChange}
            className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
          />
        </div>
      </div>
      {error && <div className="text-red-600 text-sm p-3 bg-red-50 rounded-md">{error}</div>}
      <div className="flex flex-col sm:flex-row gap-2 justify-end pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving} className="w-full sm:w-auto">
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving} className="w-full sm:w-auto">
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
} 
