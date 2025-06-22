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
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getColumns, type SshKey } from "./columns";
import { SshKeysService } from "@/lib/api/services/SshKeysService";
import { SshKeyHostMappingsService } from "@/lib/api/services/SshKeyHostMappingsService";
import { HostServersService } from "@/lib/api/services/HostServersService";
import type { HostServerResponse } from "@/lib/api/models/HostServerResponse";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface DataTableProps {
  data: SshKey[];
  onChange?: () => void;
}

export function DataTable({ data, onChange }: DataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  const [deleteKey, setDeleteKey] = React.useState<SshKey | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const [editKey, setEditKey] = React.useState<SshKey | null>(null);

  const [mappingKey, setMappingKey] = React.useState<SshKey | null>(null);

  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = React.useState(false);

  const handleDelete = (key: SshKey) => setDeleteKey(key);
  const handleEdit = (key: SshKey) => setEditKey(key);
  const handleCreateMapping = (key: SshKey) => setMappingKey(key);

  const confirmDelete = async () => {
    if (!deleteKey) return;
    setIsDeleting(true);
    try {
      await SshKeysService.deleteSshKey(deleteKey.id);
      setDeleteKey(null);
      if (onChange) onChange();
    } catch (e) {
      console.error("Failed to delete SSH key:", e);
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmBulkDelete = async () => {
    setIsDeleting(true);
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const idsToDelete = selectedRows.map(row => row.original.id);
    try {
      await Promise.all(idsToDelete.map(id => SshKeysService.deleteSshKey(id)));
      if (onChange) onChange();
      setRowSelection({});
    } catch (e) {
      console.error("Failed to bulk delete SSH keys:", e);
    } finally {
      setIsDeleting(false);
      setIsBulkDeleteConfirmOpen(false);
    }
  };

  const columns = React.useMemo(() => getColumns({
    onEdit: handleEdit,
    onDelete: handleDelete,
    onCreateMapping: handleCreateMapping,
  }), [data]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, globalFilter, rowSelection },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableRowSelection: true,
  });

  const numSelected = Object.keys(rowSelection).length;

  return (
    <div>
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter keys..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        {numSelected > 0 && (
          <Button
            variant="destructive"
            onClick={() => setIsBulkDeleteConfirmOpen(true)}
            className="ml-4"
          >
            Delete Selected ({numSelected})
          </Button>
        )}
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
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
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={table.getAllColumns().length} className="h-24 text-center">
                  No SSH keys found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {numSelected} of {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteKey && (
        <Dialog open={!!deleteKey} onOpenChange={(open) => !open && setDeleteKey(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete SSH Key</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete the key "{deleteKey.name}"? This action cannot be undone and may remove access to multiple servers.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteKey(null)}>Cancel</Button>
              <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Bulk Delete Confirmation Dialog */}
      {isBulkDeleteConfirmOpen && (
        <Dialog open={isBulkDeleteConfirmOpen} onOpenChange={setIsBulkDeleteConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Selected SSH Keys</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete the {numSelected} selected key(s)? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsBulkDeleteConfirmOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={confirmBulkDelete} disabled={isDeleting}>
                {isDeleting ? "Deleting..." : `Delete ${numSelected} Keys`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Placeholder for EditSshKeyDialog */}
      {editKey && (
        <EditSshKeyDialog
          sshKey={editKey}
          open={!!editKey}
          onOpenChange={(open) => !open && setEditKey(null)}
          onSuccess={() => {
            setEditKey(null);
            if (onChange) onChange();
          }}
        />
      )}

      {/* Create Mapping Dialog */}
      {mappingKey && (
        <CreateMappingDialog
          sshKey={mappingKey}
          open={!!mappingKey}
          onOpenChange={(open) => !open && setMappingKey(null)}
          onSuccess={() => {
            setMappingKey(null);
            if (onChange) onChange();
          }}
        />
      )}
    </div>
  );
}

// Edit SSH Key Dialog Component
function EditSshKeyDialog({ sshKey, open, onOpenChange, onSuccess }: {
  sshKey: SshKey;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [name, setName] = React.useState(sshKey.name);
  const [description, setDescription] = React.useState(sshKey.description || "");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Note: SshKeysService does not have an update method in the provided services.
      // This is a placeholder for the API call. You would need to add an update endpoint.
      console.log("Updating key:", sshKey.id, { name, description });
      // await SshKeysService.updateSshKey(sshKey.id, { name, description });
      onSuccess();
    } catch (error) {
      console.error("Failed to update key:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit SSH Key</DialogTitle>
          <DialogDescription>
            Update the details for your SSH key.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="key-name">Key Name</Label>
            <Input id="key-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="key-description">Description</Label>
            <Input id="key-description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Create Mapping Dialog Component
function CreateMappingDialog({ sshKey, open, onOpenChange, onSuccess }: {
  sshKey: SshKey;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [hosts, setHosts] = React.useState<HostServerResponse[]>([]);
  const [selectedHostId, setSelectedHostId] = React.useState<string>("");
  const [username, setUsername] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      HostServersService.getAllHostServers()
        .then(setHosts)
        .catch(err => console.error("Failed to fetch hosts:", err));
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHostId || !username) return;
    setIsSubmitting(true);
    try {
      await SshKeyHostMappingsService.createSshKeyHostMapping({
        sshKeyId: sshKey.id,
        hostServerId: selectedHostId,
        hostserverUsername: username,
      });
      onSuccess();
    } catch (error) {
      console.error("Failed to create mapping:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create SSH Key Mapping</DialogTitle>
          <DialogDescription>
            Grant key "{sshKey.name}" access to a host.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="host-select">Select Host</Label>
            <Select onValueChange={setSelectedHostId}>
              <SelectTrigger id="host-select">
                <SelectValue placeholder="Select a host server" />
              </SelectTrigger>
              <SelectContent>
                {hosts.map(host => (
                  <SelectItem key={host.id} value={host.id!}>
                    {host.hostname} ({host.ip_address})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username for the host"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting || !selectedHostId || !username}>
              {isSubmitting ? "Creating..." : "Create Mapping"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 