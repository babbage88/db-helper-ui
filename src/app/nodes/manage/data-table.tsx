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
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { getColumns, type Node } from "./columns";
import { HostServersService } from "@/lib/api/services/HostServersService";
import { SecretsService } from "@/lib/api/services/SecretsService";
import { ExternalApplicationsService } from "@/lib/api/services/ExternalApplicationsService";
import { SshKeyHostMappingsService } from "@/lib/api/services/SshKeyHostMappingsService";
import type { CreateSshKeyHostMappingRequestWithoutUserID } from "@/lib/api/models/CreateSshKeyHostMappingRequestWithoutUserID";
import type { CreateSshKeyHostMappingResponse } from "@/lib/api/models/CreateSshKeyHostMappingResponse";
import { NetworkPingService } from "@/lib/api/services/NetworkPingService";
import type { PingResponse } from "@/lib/api/models/PingResponse";

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
  const [sshKeyNode, setSshKeyNode] = React.useState<Node | null>(null); // For SSH Key modal
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = React.useState(false);
  const [nodesWithPingStatus, setNodesWithPingStatus] = React.useState<Node[]>([]);
  const [isPinging, setIsPinging] = React.useState(false);

  // Ping all nodes to check their status
  const pingNodes = React.useCallback(async (nodes: Node[]) => {
    setIsPinging(true);
    const pingPromises = nodes.map(async (node) => {
      try {
        const pingResponse = await NetworkPingService.pingHostServer({
          hostServerId: node.ID
        });
        return {
          ...node,
          pingStatus: {
            success: pingResponse.success,
            latency: pingResponse.latency,
            error: pingResponse.error
          }
        };
      } catch (error) {
        return {
          ...node,
          pingStatus: {
            success: false,
            latency: "0ms",
            error: "Ping failed"
          }
        };
      }
    });

    const results = await Promise.all(pingPromises);
    setNodesWithPingStatus(results);
    setIsPinging(false);
  }, []);

  // Update ping status when data changes
  React.useEffect(() => {
    if (data.length > 0) {
      pingNodes(data);
    } else {
      setNodesWithPingStatus([]);
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
  const handleAddSshKey = (node: Node) => setSshKeyNode(node);

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
    onAddSshKey: handleAddSshKey,
  }), []);

  const table = useReactTable({
    data: nodesWithPingStatus,
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
    <div>
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter nodes..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => pingNodes(data)}
          disabled={isPinging}
          className="ml-2"
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${isPinging ? 'animate-spin' : ''}`} />
          {isPinging ? 'Pinging...' : 'Refresh Status'}
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
          {numSelected} of {table.getFilteredRowModel().rows.length} row(s) selected.
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
      {/* Bulk Delete Confirmation Dialog */}
      {isBulkDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80">
          <div className="bg-card p-6 rounded shadow-lg min-w-[300px]">
            <h2 className="font-bold mb-2">Delete Selected Nodes</h2>
            <p>Are you sure you want to delete {numSelected} selected node(s)?</p>
            <p className="text-sm text-muted-foreground mt-2">
              You can either remove your access to these nodes or delete the nodes for all users.
            </p>
            <div className="flex gap-2 mt-4">
              <Button variant="destructive" onClick={confirmBulkDelete} disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Delete Nodes Completely"}
              </Button>
              <Button variant="secondary" onClick={confirmBulkDeleteMappings} disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Delete My Access Only"}
              </Button>
              <Button variant="outline" onClick={() => setIsBulkDeleteConfirmOpen(false)} disabled={isDeleting}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* View Modal */}
      {viewNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80">
          <div className="bg-card p-6 rounded shadow-lg min-w-[300px]">
            <h2 className="font-bold mb-2">Node Details</h2>
            {isViewLoading ? (
              <div>Loading...</div>
            ) : (
              <pre className="text-xs mb-4">{JSON.stringify(viewNodeDetails, null, 2)}</pre>
            )}
            <Button onClick={() => { setViewNode(null); setViewNodeDetails(null); }}>Close</Button>
          </div>
        </div>
      )}
      {/* Delete Confirm Modal */}
      {deleteNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80">
          <div className="bg-card p-6 rounded shadow-lg min-w-[300px]">
            <h2 className="font-bold mb-2">Delete Node</h2>
            <p>Are you sure you want to delete <b>{deleteNode.Hostname}</b>?</p>
            <p className="text-sm text-muted-foreground mt-2">
              You can either remove your access to this node or delete the node for all users.
            </p>
            <div className="flex gap-2 mt-4">
              <Button variant="destructive" onClick={confirmDeleteNode} disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Delete Node Completely"}
              </Button>
               <Button variant="secondary" onClick={confirmDeleteMapping} disabled={isDeleting || !deleteNode.mappingId}>
                {isDeleting ? "Deleting..." : "Delete My Access Only"}
              </Button>
              <Button variant="outline" onClick={() => setDeleteNode(null)} disabled={isDeleting}>
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
        sshKeyId = secretRes.id;
      }
      // Create Sudo Password secret if provided
      if (form.SudoPassword) {
        const secretRes = await SecretsService.createUserSecret({ secret: form.SudoPassword });
        sudoPasswordId = secretRes.id;
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
    keyType: "rsa",
  });
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
          keyType: form.keyType,
          description: `SSH key for ${node.Hostname}`,
        };
        const secretRes = await SecretsService.createUserSecret({ 
          secret: JSON.stringify(sshKeyData),
          application_id: applicationId
        });
        sshKeyId = secretRes.id;
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

      // Create SSH key host mapping if SSH key was created and username exists
      if (sshKeyId && node.Username) {
        const mappingRequest: CreateSshKeyHostMappingRequestWithoutUserID = {
          hostServerId: node.ID.toString(),
          hostserverUsername: node.Username,
          sshKeyId: sshKeyId,
        };
        
        try {
          await SshKeyHostMappingsService.createSshKeyHostMapping(mappingRequest);
        } catch (mappingError) {
          console.error("Failed to create SSH key host mapping:", mappingError);
          // Don't fail the entire operation if mapping fails
        }
      }

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
        <label className="block text-sm font-medium">SSH Key Type</label>
        <select
          className="border rounded px-2 py-1 w-full"
          name="keyType"
          value={form.keyType}
          onChange={handleChange}
          required
        >
          <option value="rsa">RSA</option>
          <option value="ed25519">Ed25519</option>
          <option value="ecdsa">ECDSA</option>
          <option value="dsa">DSA</option>
        </select>
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