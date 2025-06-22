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
import { SshKeysService } from "@/lib/api/services/SshKeysService";
import { useAuth } from "@/lib/auth-context";
import { AddSshKeyDialog } from "@/components/db-helper/add-ssh-key-dialog";
import { type SshKey } from "@/app/keys/manage/columns";
import { DataTable } from "@/app/keys/manage/data-table";
import { TokenService } from "@/lib/tokenManager";

export default function ManageSshKeysPage() {
  const [keys, setKeys] = React.useState<SshKey[]>([]);
  const { isAuthenticated } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchKeys = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const userInfo = TokenService.getUserInfo();
      if (!userInfo || !userInfo.userId) {
        console.error("User not logged in");
        setKeys([]);
        return;
      }
      const response = await SshKeysService.getSshKeysByUserId(userInfo.userId);
      const mapped = response.map(key => ({
        id: key.id || "",
        name: key.name || "",
        description: key.description,
        keyType: key.keyType,
        createdAt: key.createdAt,
      }));
      setKeys(mapped as SshKey[]);
    } catch (error) {
      console.error("Failed to fetch SSH keys:", error);
      setKeys([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (isAuthenticated) {
      fetchKeys();
    }
  }, [isAuthenticated, fetchKeys]);

  const handleAddKeySuccess = () => {
    fetchKeys();
    setIsAddDialogOpen(false);
  };

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>SSH Keys</CardTitle>
              <CardDescription>
                Manage your SSH keys for server access.
              </CardDescription>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add SSH Key
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? <div>Loading...</div> : <DataTable data={keys} onChange={fetchKeys} />}
        </CardContent>
      </Card>

      <AddSshKeyDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={handleAddKeySuccess}
      />
    </div>
  );
} 