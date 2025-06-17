"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { HostServersService } from "@/lib/api/services/HostServersService";
import type { CreateHostServerRequest } from "@/lib/api/models/CreateHostServerRequest";
import { AddNodeDialog } from "./add-node-dialog";
import type { NodeFormValues } from "./add-node-dialog";
import { DataTable } from "./data-table";
import type { Node } from "./columns";

export default function ManageNodesPage() {
  const [nodes, setNodes] = React.useState<Node[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchNodes = React.useCallback(async () => {
    try {
      const response = await HostServersService.getAllHostServers();
      const mapped = (response as any[]).map(node => ({
        ID: node.id ?? -1,
        Hostname: node.hostname,
        IpAddress: node.ip_address,
        IsContainerHost: node.is_container_host,
        IsVirtualMachine: node.is_virtual_machine,
        IsVmHost: node.is_vm_host,
        IDDbHost: node.is_db_host,
        LastModified: node.last_modified,
        Username: node.username,
        PublicSshKeyname: node.public_ssh_keyname,
      }));
      setNodes(mapped);
    } catch (error) {
      console.error("Failed to fetch nodes:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchNodes();
  }, [fetchNodes]);

  const handleAddNode = async (nodeData: NodeFormValues & { ssh_key_id?: string; sudo_password_token_id?: string }) => {
    try {
      const createRequest: CreateHostServerRequest = {
        hostname: nodeData.hostname,
        ip_address: nodeData.ipAddress,
        is_container_host: nodeData.isContainerHost,
        is_virtual_machine: nodeData.isVirtualMachine,
        is_vm_host: nodeData.isVmHost,
        is_db_host: nodeData.idDbHost,
        username: nodeData.username,
        ssh_key_id: nodeData.ssh_key_id,
        sudo_password_token_id: nodeData.sudo_password_token_id,
      };
      await HostServersService.createHostServer(createRequest);
      fetchNodes();
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error("Failed to add node:", error);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Managed Nodes</CardTitle>
              <CardDescription>
                Manage your SSH-accessible servers and deployment targets
              </CardDescription>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Node
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable data={nodes} onChange={fetchNodes} />
        </CardContent>
      </Card>

      <AddNodeDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={handleAddNode}
      />
    </div>
  );
} 