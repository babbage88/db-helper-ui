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
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getColumns, type RoleRow } from "./role-columns";
import { showErrorToast, showSuccessToast } from "@/lib/toast-utils";
import { RolesCrudService } from "@/lib/api/services/RolesCrudService";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DataTableProps {
  data: RoleRow[];
  onChange?: () => void;
  onEdit?: (role: RoleRow) => void;
  onManagePermissions?: (role: RoleRow) => void;
}

export function RoleDataTable({ data, onChange, onEdit, onManagePermissions }: DataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  const [deleteRole, setDeleteRole] = React.useState<RoleRow | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isDeletingBulk, setIsDeletingBulk] = React.useState(false);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const handleDelete = (role: RoleRow) => setDeleteRole(role);
  const handleEdit = (role: RoleRow) => {
    if (onEdit) onEdit(role);
  };
  const handleManagePermissions = (role: RoleRow) => {
    if (onManagePermissions) onManagePermissions(role);
  };

  const confirmDelete = async () => {
    if (!deleteRole) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await (RolesCrudService as any).softDeleteRoleById({ targetRoleId: deleteRole.id });
      showSuccessToast(
        "Role deleted successfully",
        `The "${deleteRole.roleName}" role has been deleted.`
      );
      setDeleteRole(null);
      if (onChange) onChange();
    } catch (e: any) {
      console.error("Failed to delete role:", e);
      const errorMessage = e?.message || "Failed to delete role. Please try again.";
      setDeleteError(errorMessage);
      showErrorToast(
        "Failed to delete role",
        errorMessage
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmBulkDelete = async () => {
    setIsDeletingBulk(true);
    try {
      // Bulk delete logic here if available in API
      if (onChange) onChange();
      setRowSelection({});
    } catch (e) {
      console.error("Failed to bulk delete roles:", e);
    } finally {
      setIsDeletingBulk(false);
      setIsBulkDeleteConfirmOpen(false);
    }
  };

  const columns = React.useMemo(
    () =>
      getColumns({
        onEdit: handleEdit,
        onDelete: handleDelete,
        onManagePermissions: handleManagePermissions,
      }),
    [data]
  );

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
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Input
          placeholder="Search roles..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        {numSelected > 0 && (
          <Button
            variant="destructive"
            onClick={() => setIsBulkDeleteConfirmOpen(true)}
            size="sm"
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
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No roles found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount() || 1}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteRole} onOpenChange={() => {
        setDeleteRole(null);
        setDeleteError(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Role</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the role "{deleteRole?.roleName}"?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
              <p className="font-medium">Error</p>
              <p>{deleteError}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setDeleteRole(null);
              setDeleteError(null);
            }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog
        open={isBulkDeleteConfirmOpen}
        onOpenChange={setIsBulkDeleteConfirmOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Multiple Roles</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {numSelected} selected role(s)?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsBulkDeleteConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmBulkDelete}
              disabled={isDeletingBulk}
            >
              {isDeletingBulk ? "Deleting..." : "Delete All"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
