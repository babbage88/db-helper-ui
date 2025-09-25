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
import { ChevronLeft, ChevronRight, Plus, RefreshCw } from "lucide-react";
import { getColumns, type UserSecret } from "./columns";
import { SecretsService } from "@/lib/api/services/SecretsService";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface DataTableProps {
  data: UserSecret[];
  userId: string; // needed for fetching/creating secrets
  onChange?: () => void;
}

export function DataTable({ data, userId, onChange }: DataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  const [deleteSecret, setDeleteSecret] = React.useState<UserSecret | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const [retrieveSecret, setRetrieveSecret] = React.useState<UserSecret | null>(null);
  const [isRetrieving, setIsRetrieving] = React.useState(false);

  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = React.useState(false);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);

  const handleDelete = (secret: UserSecret) => setDeleteSecret(secret);

  const confirmDelete = async () => {
    if (!deleteSecret) return;
    setIsDeleting(true);
    try {
      await SecretsService.deleteUserSecretById(deleteSecret.id);
      setDeleteSecret(null);
      onChange?.();
    } catch (e) {
      console.error("Failed to delete secret:", e);
    } finally {
      setIsDeleting(false);
    }
  };


  const handleRetrieve = async (secret: UserSecret) => {
    // verify if initial set is actually needed, i dont think it is
    //setRetrieveSecret(secret);
    setIsRetrieving(true);
    try {
      const retrievedSecret = await SecretsService.getUserSecretById(secret.id!);
      secret.secret = retrievedSecret.secret;
      setRetrieveSecret(secret);
    } catch (error) {
      console.error("Failed retrieving secret content", error);
      setRetrieveSecret(secret); // Show at least the existing secret metadata
    } finally {
      setIsRetrieving(false);
    }
  };

  const confirmBulkDelete = async () => {
    setIsDeleting(true);
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const idsToDelete = selectedRows.map(row => row.original.id);
    try {
      await Promise.all(idsToDelete.map(id => SecretsService.deleteUserSecretById(id)));
      onChange?.();
      setRowSelection({});
    } catch (e) {
      console.error("Failed to bulk delete secrets:", e);
    } finally {
      setIsDeleting(false);
      setIsBulkDeleteConfirmOpen(false);
    }
  };

  const columns = React.useMemo(() => getColumns({ onDelete: handleDelete, onRetrieveSecret: handleRetrieve }), [data]);

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
          placeholder="Filter secrets..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        <Button
          variant="default"
          className="ml-4"
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" /> Add Secret
        </Button>
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
                  No secrets found.
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
      {deleteSecret && (
        <Dialog open={!!deleteSecret} onOpenChange={(open) => !open && setDeleteSecret(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Secret</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this secret? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteSecret(null)}>Cancel</Button>
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
              <DialogTitle>Delete Selected Secrets</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete the {numSelected} selected secret(s)? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsBulkDeleteConfirmOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={confirmBulkDelete} disabled={isDeleting}>
                {isDeleting ? "Deleting..." : `Delete ${numSelected} Secrets`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}


      {/* Responsive View Modal */}
      {retrieveSecret && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-2 sm:p-4">
          <div className="bg-card p-2 sm:p-6 rounded shadow-lg w-full sm:max-w-2xl sm:mx-auto max-h-[90vh] overflow-y-auto">
            <h2 className="font-bold mb-2 text-lg">Secret Details</h2>
            {isRetrieving ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                Loading...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <pre className="text-xs mb-4 whitespace-pre-wrap">{JSON.stringify(retrieveSecret, null, 2)}</pre>
              </div>
            )}
            <div className="flex justify-end">
              <Button onClick={() => { setRetrieveSecret(null); setRetrieveSecret(null); }}>Close</Button>
            </div>
          </div>
        </div>
      )}


      {/* Create Secret Dialog */}
      {isCreateDialogOpen && (
        <CreateSecretDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          userId={userId}
          onSuccess={() => {
            setIsCreateDialogOpen(false);
            onChange?.();
          }}
        />
      )}
    </div>
  );
}

// Create Secret Dialog
function CreateSecretDialog({
  open,
  onOpenChange,
  userId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onSuccess: () => void;
}) {
  const [appId, setAppId] = React.useState("");
  const [secret, setSecret] = React.useState("");
  const [expiration, setExpiration] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await SecretsService.createUserSecret({
        application_id: appId,
        secret,
        expiration: expiration || undefined
      });
      onSuccess();
    } catch (err) {
      console.error("Failed to create secret:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Secret</DialogTitle>
          <DialogDescription>
            Add a new application secret for user {userId}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="app-id">Application ID</Label>
            <Input id="app-id" value={appId} onChange={(e) => setAppId(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="secret">Secret</Label>
            <Input id="secret" value={secret} onChange={(e) => setSecret(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expiration">Expiration (optional)</Label>
            <Input id="expiration" type="date" value={expiration} onChange={(e) => setExpiration(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Secret"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
