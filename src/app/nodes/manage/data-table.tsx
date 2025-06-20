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
} from "@tanstack/react-table";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getColumns, type Node } from "./columns";
import { HostServersService } from "@/lib/api/services/HostServersService";
import { SecretsService } from "@/lib/api/services/SecretsService";
import { ExternalApplicationsService } from "@/lib/api/services/ExternalApplicationsService";

interface DataTableProps {
  data: Node[];
  onChange?: () => void; // callback to refetch data after CRUD
}

export function DataTable({ data, onChange }: DataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [viewNode, setViewNode] = React.useState<Node | null>(null);
  const [editNode, setEditNode] = React.useState<Node | null>(null);
  const [deleteNode, setDeleteNode] = React.useState<Node | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [sshKeyNode, setSshKeyNode] = React.useState<Node | null>(null); // For SSH Key modal

  // Handlers
  const handleEdit = (node: Node) => setEditNode(node);
  const handleView = (node: Node) => setViewNode(node);
  const handleDelete = (node: Node) => setDeleteNode(node);
  const handleAddSshKey = (node: Node) => setSshKeyNode(node);

  const confirmDelete = async () => {
    if (!deleteNode) return;
    setIsDeleting(true);
    try {
      await HostServersService.deleteHostServer(deleteNode.ID.toString());
      setDeleteNode(null);
      if (onChange) onChange();
    } catch (e) {
      // handle error
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = React.useMemo(() => getColumns({
    onEdit: handleEdit,
    onDelete: handleDelete,
    onView: handleView,
    onAddSshKey: handleAddSshKey,
  }), [data]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, columnId, filterValue) => {
      // For Type column, match any type string
      if (columnId === "IsContainerHost") {
        const types = [];
        if (row.original.IsContainerHost) types.push("Container Host");
        if (row.original.IsVirtualMachine) types.push("Virtual Machine");
        if (row.original.IsVmHost) types.push("VM Host");
        if (row.original.IDDbHost) types.push("DB Host");
        if (types.length === 0) types.push("Physical Server");
        return types.some(type => type.toLowerCase().includes(String(filterValue).toLowerCase()));
      }
      return Object.values(row.original).some((value) =>
        String(value ?? "").toLowerCase().includes(String(filterValue).toLowerCase())
      );
    },
  });

  return (
    <div>
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter nodes..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
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
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
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
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </div>
        <div className="space-x-2">
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
      {/* View Modal */}
      {viewNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80">
          <div className="bg-card p-6 rounded shadow-lg min-w-[300px]">
            <h2 className="font-bold mb-2">Node Details</h2>
            <pre className="text-xs mb-4">{JSON.stringify(viewNode, null, 2)}</pre>
            <Button onClick={() => setViewNode(null)}>Close</Button>
          </div>
        </div>
      )}
      {/* Delete Confirm Modal */}
      {deleteNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80">
          <div className="bg-card p-6 rounded shadow-lg min-w-[300px]">
            <h2 className="font-bold mb-2">Delete Node</h2>
            <p>Are you sure you want to delete <b>{deleteNode.Hostname}</b>?</p>
            <div className="flex gap-2 mt-4">
              <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
              <Button variant="outline" onClick={() => setDeleteNode(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Edit Modal (fully implemented) */}
      {editNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80">
          <div className="bg-card p-6 rounded shadow-lg min-w-[350px] max-w-[90vw]">
            <h2 className="font-bold mb-2">Edit Node</h2>
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
      {/* SSH Key Modal */}
      {sshKeyNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80">
          <div className="bg-card p-6 rounded shadow-lg min-w-[350px] max-w-[90vw]">
            <h2 className="font-bold mb-2">Add SSH Key to {sshKeyNode.Hostname}</h2>
            <AddSshKeyForm
              node={sshKeyNode}
              onCancel={() => setSshKeyNode(null)}
              onSuccess={() => {
                setSshKeyNode(null);
                if (onChange) onChange();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function EditNodeForm({ node, onCancel, onSuccess }: {
  node: Node;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = React.useState({
    Hostname: node.Hostname,
    IpAddress: node.IpAddress,
    IsContainerHost: node.IsContainerHost,
    IsVirtualMachine: node.IsVirtualMachine,
    IsVmHost: node.IsVmHost,
    IDDbHost: node.IDDbHost,
    Username: node.Username || "",
    SshPrivateKey: "",
    SudoPassword: "",
  });
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
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
        sshKeyId = secretRes.id || secretRes.ID || secretRes.secret_id;
      }
      // Create Sudo Password secret if provided
      if (form.SudoPassword) {
        const secretRes = await SecretsService.createUserSecret({ secret: form.SudoPassword });
        sudoPasswordId = secretRes.id || secretRes.ID || secretRes.secret_id;
      }
      await HostServersService.updateHostServer(node.ID.toString(), {
        hostname: form.Hostname,
        ip_address: form.IpAddress,
        is_container_host: form.IsContainerHost,
        is_virtual_machine: form.IsVirtualMachine,
        is_vm_host: form.IsVmHost,
        is_db_host: form.IDDbHost,
        username: form.Username,
        ssh_key_id: sshKeyId,
        sudo_password_token_id: sudoPasswordId,
      });
      onSuccess();
    } catch (e: any) {
      setError(e?.message || "Failed to update node");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Hostname</label>
        <input
          className="border rounded px-2 py-1 w-full"
          name="Hostname"
          value={form.Hostname}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium">IP Address</label>
        <input
          className="border rounded px-2 py-1 w-full"
          name="IpAddress"
          value={form.IpAddress}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Username</label>
        <input
          className="border rounded px-2 py-1 w-full"
          name="Username"
          value={form.Username}
          onChange={handleChange}
        />
      </div>
      <div className="flex gap-4">
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            name="IsContainerHost"
            checked={form.IsContainerHost}
            onChange={handleChange}
          />
          Container Host
        </label>
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            name="IsVirtualMachine"
            checked={form.IsVirtualMachine}
            onChange={handleChange}
          />
          Virtual Machine
        </label>
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            name="IsVmHost"
            checked={form.IsVmHost}
            onChange={handleChange}
          />
          VM Host
        </label>
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            name="IDDbHost"
            checked={form.IDDbHost}
            onChange={handleChange}
          />
          DB Host
        </label>
      </div>
      <div>
        <label className="block text-sm font-medium">SSH Private Key</label>
        <input
          className="border rounded px-2 py-1 w-full mb-1"
          name="SshPrivateKey"
          value={form.SshPrivateKey}
          onChange={handleChange}
          placeholder="Paste private key or upload file"
        />
        <input
          type="file"
          accept=".pem,.key,.txt"
          name="SshPrivateKey"
          onChange={handleFileChange}
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Sudo Password</label>
        <input
          className="border rounded px-2 py-1 w-full mb-1"
          name="SudoPassword"
          type="password"
          value={form.SudoPassword}
          onChange={handleChange}
          placeholder="Enter sudo password or upload file"
        />
        <input
          type="file"
          accept=".txt"
          name="SudoPassword"
          onChange={handleFileChange}
        />
      </div>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}

function AddSshKeyForm({ node, onCancel, onSuccess }: {
  node: Node;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = React.useState({
    publicSshKeyname: "",
    sshPrivateKey: "",
    sshPublicKey: "",
  });
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // File input handler for SSH keys
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

      // Create SSH key if both private and public keys are provided
      if (form.sshPrivateKey && form.sshPublicKey) {
        // First, get the external application ID for "ssh_keys"
        const appResponse = await ExternalApplicationsService.getExternalApplicationIdByName("ssh_keys");
        const applicationId = appResponse.id;
        
        if (!applicationId) {
          throw new Error("Could not find ssh_keys application");
        }

        const sshKeyData = {
          name: form.publicSshKeyname,
          privateKey: form.sshPrivateKey,
          publicKey: form.sshPublicKey,
          keyType: "rsa", // Default to RSA, could be made configurable
          description: `SSH key for ${node.Hostname}`,
        };
        const secretRes = await SecretsService.createUserSecret({ 
          secret: JSON.stringify(sshKeyData),
          application_id: applicationId
        });
        sshKeyId = secretRes.id || secretRes.ID || secretRes.secret_id;
      }

      // Update the node with the new SSH key ID
      await HostServersService.updateHostServer(node.ID.toString(), {
        hostname: node.Hostname,
        ip_address: node.IpAddress,
        is_container_host: node.IsContainerHost,
        is_virtual_machine: node.IsVirtualMachine,
        is_vm_host: node.IsVmHost,
        is_db_host: node.IDDbHost,
        username: node.Username,
        ssh_key_id: sshKeyId,
        sudo_password_token_id: undefined, // Keep existing sudo password
      });
      onSuccess();
    } catch (e: any) {
      setError(e?.message || "Failed to add SSH key");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">SSH Key Name</label>
        <input
          className="border rounded px-2 py-1 w-full"
          name="publicSshKeyname"
          value={form.publicSshKeyname}
          onChange={handleChange}
          placeholder="id_rsa"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium">SSH Private Key</label>
        <input
          className="border rounded px-2 py-1 w-full mb-1"
          name="sshPrivateKey"
          value={form.sshPrivateKey}
          onChange={handleChange}
          placeholder="Paste private key or upload file"
          required
        />
        <input
          type="file"
          accept=".pem,.key,.txt"
          name="sshPrivateKey"
          onChange={handleFileChange}
        />
      </div>
      <div>
        <label className="block text-sm font-medium">SSH Public Key</label>
        <input
          className="border rounded px-2 py-1 w-full mb-1"
          name="sshPublicKey"
          value={form.sshPublicKey}
          onChange={handleChange}
          placeholder="Paste public key or upload file"
          required
        />
        <input
          type="file"
          accept=".pub,.txt"
          name="sshPublicKey"
          onChange={handleFileChange}
        />
      </div>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Adding..." : "Add SSH Key"}
        </Button>
      </div>
    </form>
  );
} 