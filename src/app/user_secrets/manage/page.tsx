"use client";

import { useEffect, useState } from "react";
import { SecretsService } from "@/lib/api/services/SecretsService"; // adjust import path to your generated client
import { type UserSecretEntry } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function Page({ params }: { params: { userid: string } }) {
  const { userid } = params;
  const [secrets, setSecrets] = useState<UserSecretEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    SecretsService.getUserSecretEntries(userid)
      .then((data) => {
        setSecrets(data);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load secrets.");
      })
      .finally(() => setLoading(false));
  }, [userid]);

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>User Secrets for {userid}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" />
            </div>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : secrets.length === 0 ? (
            <p className="text-muted-foreground">No secrets found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>App Name</TableHead>
                  <TableHead>App URL</TableHead>
                  <TableHead>Secret ID</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Expiry</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {secrets.map((entry, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{entry.appInfo?.name ?? "-"}</TableCell>
                    <TableCell>{entry.appInfo?.url ?? "-"}</TableCell>
                    <TableCell>{entry.secretMetadata?.id ?? "-"}</TableCell>
                    <TableCell>
                      {entry.secretMetadata?.createdAt
                        ? new Date(entry.secretMetadata.createdAt).toLocaleString()
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {entry.secretMetadata?.expiry
                        ? new Date(entry.secretMetadata.expiry).toLocaleString()
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
