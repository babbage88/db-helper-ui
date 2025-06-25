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
import { SshKeyHostMappingsService } from "@/lib/api/services/SshKeyHostMappingsService";
import { TokenService } from "@/lib/tokenManager";
import { AddNodeDialog } from "./add-node-dialog";
import { DataTable } from "./data-table";
import type { Node } from "./columns";

export default function ManageNodesPage() {
  const [nodes, setNodes] = React.useState<Node[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchNodes = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const userInfo = TokenService.getUserInfo();
      if (!userInfo || !userInfo.userId) {
        console.error("User not logged in");
        setNodes([]);
        return;
      }

      const [allServers, userMappings] = await Promise.all([
        HostServersService.getAllHostServers(),
        SshKeyHostMappingsService.getSshKeyHostMappingsByUserId(userInfo.userId)
      ]);

      const userMappingsMap = new Map(userMappings.map(m => [m.hostServerId, m]));

      const accessibleNodes = allServers
        .filter(server => server.id && userMappingsMap.has(server.id))
        .map(server => {
          const mapping = userMappingsMap.get(server.id!);
          return {
            ID: server.id || "",
            Hostname: server.hostname || "",
            IpAddress: server.ip_address || "",
            IsContainerHost: server.is_container_host || false,
            IsVirtualMachine: server.is_virtual_machine || false,
            IsVmHost: server.is_vm_host || false,
            IDDbHost: server.is_db_host || false,
            LastModified: server.last_modified,
            Username: mapping?.hostserverUsername || server.username,
            mappingId: mapping?.id,
          };
        });

      setNodes(accessibleNodes as Node[]);
    } catch (error) {
      console.error("Failed to fetch nodes:", error);
      setNodes([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchNodes();
  }, [fetchNodes]);

  const handleAddNodeSuccess = () => {
    fetchNodes();
    setIsAddDialogOpen(false);
  };

  return (
    <div className="w-full px-2 sm:px-6 py-4 sm:py-10">
      <Card className="w-full rounded-none sm:rounded-2xl">
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
        <CardContent className="px-2 sm:px-10">
          {isLoading ? <div>Loading...</div> : <DataTable data={nodes} onChange={fetchNodes} />}
        </CardContent>
      </Card>

      <AddNodeDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={handleAddNodeSuccess}
      />
    </div>
  );
} 
