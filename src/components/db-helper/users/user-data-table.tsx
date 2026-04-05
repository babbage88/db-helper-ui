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
import { getColumns, type UserRow } from "./user-columns";
import { UserCrudService } from "@/lib/api/services/UserCrudService";
import { showErrorToast, showSuccessToast } from "@/lib/toast-utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DataTableProps {
  data: UserRow[];
  onChange?: () => void;
  onResetPassword?: (user: UserRow) => void;
  onEditRole?: (user: UserRow) => void;
}

export function UserDataTable({ data, onChange, onResetPassword, onEditRole }: DataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  const [deleteUser, setDeleteUser] = React.useState<UserRow | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isDeletingBulk, setIsDeletingBulk] = React.useState(false);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = React.useState(false);

  const [statusToggleUser, setStatusToggleUser] = React.useState<UserRow | null>(null);
  const [isTogglingStatus, setIsTogglingStatus] = React.useState(false);
  const [toggleStatusError, setToggleStatusError] = React.useState<string | null>(null);

  const handleDelete = (user: UserRow) => setDeleteUser(user);
  const handleToggleStatus = (user: UserRow) => setStatusToggleUser(user);
  const handleResetPassword = (user: UserRow) => {
    if (onResetPassword) {
      onResetPassword(user);
    }
  };
  const handleEditRole = (user: UserRow) => {
    if (onEditRole) {
      onEditRole(user);
    }
  };

  const confirmDelete = async () => {
    if (!deleteUser) return;
    setIsDeleting(true);
    try {
      await UserCrudService.softDeleteUserById({ targetUserId: deleteUser.userId });
      setDeleteUser(null);
      if (onChange) onChange();
    } catch (e) {
      console.error("Failed to delete user:", e);
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmToggleStatus = async () => {
    if (!statusToggleUser) return;
    setIsTogglingStatus(true);
    setToggleStatusError(null);
    try {
      if (statusToggleUser.enabled) {
        await UserCrudService.disableUser({ targetUserId: statusToggleUser.userId });
        showSuccessToast(
          "User disabled successfully",
          `${statusToggleUser.username} has been disabled.`
        );
      } else {
        await UserCrudService.enableUser({ targetUserId: statusToggleUser.userId });
        showSuccessToast(
          "User enabled successfully",
          `${statusToggleUser.username} has been enabled.`
        );
      }
      setStatusToggleUser(null);
      if (onChange) onChange();
    } catch (e: any) {
      console.error("Failed to toggle user status:", e);
      const errorMessage = e?.message || "Failed to update user status. Please try again.";
      setToggleStatusError(errorMessage);
      showErrorToast(
        "Failed to update user status",
        errorMessage
      );
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const confirmBulkDelete = async () => {
    setIsDeletingBulk(true);
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const userIdsToDelete = selectedRows.map((row) => row.original.userId);
    try {
      await Promise.all(
        userIdsToDelete.map((id) =>
          UserCrudService.softDeleteUserById({ targetUserId: id })
        )
      );
      if (onChange) onChange();
      setRowSelection({});
    } catch (e) {
      console.error("Failed to bulk delete users:", e);
    } finally {
      setIsDeletingBulk(false);
      setIsBulkDeleteConfirmOpen(false);
    }
  };

  const columns = React.useMemo(
    () =>
      getColumns({
        onDelete: handleDelete,
        onToggleStatus: handleToggleStatus,
        onResetPassword: handleResetPassword,
        onEdit: handleEditRole,
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
          placeholder="Search users..."
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
                  No users found.
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
      <Dialog open={!!deleteUser} onOpenChange={() => setDeleteUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the user "{deleteUser?.username}"?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteUser(null)}>
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

      {/* Status Toggle Confirmation Dialog */}
      <Dialog
        open={!!statusToggleUser}
        onOpenChange={() => {
          setStatusToggleUser(null);
          setToggleStatusError(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {statusToggleUser?.enabled ? "Disable" : "Enable"} User
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to{" "}
              {statusToggleUser?.enabled ? "disable" : "enable"} the user "
              {statusToggleUser?.username}"?
            </DialogDescription>
          </DialogHeader>
          {toggleStatusError && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
              <p className="font-medium">Error</p>
              <p>{toggleStatusError}</p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setStatusToggleUser(null);
                setToggleStatusError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmToggleStatus}
              disabled={isTogglingStatus}
              variant={statusToggleUser?.enabled ? "destructive" : "default"}
            >
              {isTogglingStatus
                ? "Updating..."
                : statusToggleUser?.enabled
                  ? "Disable"
                  : "Enable"}
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
            <DialogTitle>Delete Multiple Users</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {numSelected} selected user(s)?
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
