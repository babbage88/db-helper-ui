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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { HostServersService } from "@/lib/api/services/HostServersService";
import type { HostServer } from "@/lib/api/models/HostServer";
import { AddNodeDialog } from "./add-node-dialog";

export default function ManageNodesPage() {
  const [nodes, setNodes] = React.useState<HostServer[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchNodes = React.useCallback(async () => {
    try {
      const response = await HostServersService.getAllHostServers();
      setNodes(response);
    } catch (error) {
      console.error("Failed to fetch nodes:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchNodes();
  }, [fetchNodes]);

  const handleAddNode = async (nodeData: any) => {
    try {
      await HostServersService.createHostServer(nodeData);
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hostname</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Last Modified</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : nodes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No nodes found. Add your first node to get started.
                  </TableCell>
                </TableRow>
              ) : (
                nodes.map((node) => (
                  <TableRow key={node.ID}>
                    <TableCell>{node.Hostname}</TableCell>
                    <TableCell>{node.IpAddress}</TableCell>
                    <TableCell>
                      {node.IsContainerHost
                        ? "Container Host"
                        : node.IsVirtualMachine
                        ? "Virtual Machine"
                        : "Physical Server"}
                    </TableCell>
                    <TableCell>{node.Username}</TableCell>
                    <TableCell>
                      {node.LastModified
                        ? new Date(node.LastModified).toLocaleDateString()
                        : "N/A"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
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