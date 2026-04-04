"use client";

import * as React from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Download,
  FolderPlus,
  HardDrive,
  Loader2,
  RefreshCcw,
  Trash2,
  Upload,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatBytes,
  s3AdminApi,
  type S3BucketSummary,
  type S3EndpointSummary,
  type S3ObjectSummary,
} from "@/lib/s3-admin-api";

export default function ManageStoragePage() {
  const [endpoints, setEndpoints] = React.useState<S3EndpointSummary[]>([]);
  const [selectedEndpointName, setSelectedEndpointName] = React.useState<string>("");
  const [buckets, setBuckets] = React.useState<S3BucketSummary[]>([]);
  const [selectedBucketName, setSelectedBucketName] = React.useState<string>("");
  const [objects, setObjects] = React.useState<S3ObjectSummary[]>([]);
  const [prefix, setPrefix] = React.useState("");
  const [newBucketName, setNewBucketName] = React.useState("");
  const [uploadKey, setUploadKey] = React.useState("");
  const [uploadFile, setUploadFile] = React.useState<File | null>(null);
  const [isLoadingEndpoints, setIsLoadingEndpoints] = React.useState(true);
  const [isLoadingBuckets, setIsLoadingBuckets] = React.useState(false);
  const [isLoadingObjects, setIsLoadingObjects] = React.useState(false);
  const [isMutating, setIsMutating] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const loadEndpoints = React.useCallback(async () => {
    setIsLoadingEndpoints(true);
    setErrorMessage(null);

    try {
      const data = await s3AdminApi.listEndpoints();
      setEndpoints(data);

      if (!selectedEndpointName && data.length > 0) {
        setSelectedEndpointName(data[0].name);
      } else if (selectedEndpointName && !data.some((item) => item.name === selectedEndpointName)) {
        setSelectedEndpointName(data[0]?.name ?? "");
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("We couldn't load the registered S3 endpoints.");
      setEndpoints([]);
    } finally {
      setIsLoadingEndpoints(false);
    }
  }, [selectedEndpointName]);

  const loadBuckets = React.useCallback(async (endpointName: string) => {
    if (!endpointName) {
      setBuckets([]);
      return;
    }

    setIsLoadingBuckets(true);
    setErrorMessage(null);

    try {
      const data = await s3AdminApi.listBuckets(endpointName);
      setBuckets(data);

      if (!selectedBucketName && data.length > 0) {
        const preferred = data.find((bucket) => bucket.isDefault) ?? data[0];
        setSelectedBucketName(preferred.name);
      } else if (selectedBucketName && !data.some((item) => item.name === selectedBucketName)) {
        setSelectedBucketName(data[0]?.name ?? "");
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("We couldn't load buckets for the selected endpoint.");
      setBuckets([]);
    } finally {
      setIsLoadingBuckets(false);
    }
  }, [selectedBucketName]);

  const loadObjects = React.useCallback(async (endpointName: string, bucketName: string, nextPrefix: string) => {
    if (!endpointName || !bucketName) {
      setObjects([]);
      return;
    }

    setIsLoadingObjects(true);
    setErrorMessage(null);

    try {
      const data = await s3AdminApi.listObjects(endpointName, bucketName, nextPrefix.trim() || undefined);
      setObjects(data);
    } catch (error) {
      console.error(error);
      setErrorMessage("We couldn't load objects for the selected bucket.");
      setObjects([]);
    } finally {
      setIsLoadingObjects(false);
    }
  }, []);

  React.useEffect(() => {
    loadEndpoints();
  }, [loadEndpoints]);

  React.useEffect(() => {
    if (selectedEndpointName) {
      void loadBuckets(selectedEndpointName);
    }
  }, [selectedEndpointName, loadBuckets]);

  React.useEffect(() => {
    if (selectedEndpointName && selectedBucketName) {
      void loadObjects(selectedEndpointName, selectedBucketName, prefix);
    }
  }, [selectedEndpointName, selectedBucketName, prefix, loadObjects]);

  async function handleCreateBucket() {
    if (!selectedEndpointName || !newBucketName.trim()) {
      return;
    }

    setIsMutating(true);
    setErrorMessage(null);
    try {
      await s3AdminApi.createBucket(selectedEndpointName, newBucketName.trim());
      setNewBucketName("");
      await loadBuckets(selectedEndpointName);
    } catch (error) {
      console.error(error);
      setErrorMessage("We couldn't create that bucket.");
    } finally {
      setIsMutating(false);
    }
  }

  async function handleDeleteBucket(bucketName: string) {
    if (!selectedEndpointName || !window.confirm(`Delete bucket "${bucketName}"? The bucket must already be empty.`)) {
      return;
    }

    setIsMutating(true);
    setErrorMessage(null);
    try {
      await s3AdminApi.deleteBucket(selectedEndpointName, bucketName);
      if (selectedBucketName === bucketName) {
        setSelectedBucketName("");
      }
      await loadBuckets(selectedEndpointName);
    } catch (error) {
      console.error(error);
      setErrorMessage("We couldn't delete that bucket. Make sure it is empty first.");
    } finally {
      setIsMutating(false);
    }
  }

  async function handleUpload() {
    if (!selectedEndpointName || !selectedBucketName || !uploadFile) {
      return;
    }

    setIsMutating(true);
    setErrorMessage(null);
    try {
      await s3AdminApi.uploadObject(selectedEndpointName, selectedBucketName, uploadFile, uploadKey.trim() || undefined);
      setUploadFile(null);
      setUploadKey("");
      const input = document.getElementById("s3-upload-input") as HTMLInputElement | null;
      if (input) {
        input.value = "";
      }
      await loadObjects(selectedEndpointName, selectedBucketName, prefix);
      await loadBuckets(selectedEndpointName);
    } catch (error) {
      console.error(error);
      setErrorMessage("We couldn't upload that file.");
    } finally {
      setIsMutating(false);
    }
  }

  async function handleDeleteObject(key: string) {
    if (!selectedEndpointName || !selectedBucketName || !window.confirm(`Delete object "${key}"?`)) {
      return;
    }

    setIsMutating(true);
    setErrorMessage(null);
    try {
      await s3AdminApi.deleteObject(selectedEndpointName, selectedBucketName, key);
      await loadObjects(selectedEndpointName, selectedBucketName, prefix);
      await loadBuckets(selectedEndpointName);
    } catch (error) {
      console.error(error);
      setErrorMessage("We couldn't delete that object.");
    } finally {
      setIsMutating(false);
    }
  }

  async function handleDownloadObject(key: string) {
    if (!selectedEndpointName || !selectedBucketName) {
      return;
    }

    setIsMutating(true);
    setErrorMessage(null);
    try {
      await s3AdminApi.downloadObject(selectedEndpointName, selectedBucketName, key);
    } catch (error) {
      console.error(error);
      setErrorMessage("We couldn't download that object.");
    } finally {
      setIsMutating(false);
    }
  }

  return (
    <div className="w-full px-2 sm:px-6 py-4 sm:py-10">
      <div className="grid gap-6">
        <Card className="rounded-none sm:rounded-2xl">
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>S3 Storage Dashboard</CardTitle>
                <CardDescription>
                  Browse the configured S3-compatible endpoint, create buckets, and manage stored files.
                </CardDescription>
              </div>
              <Button variant="outline" onClick={() => void loadEndpoints()} disabled={isLoadingEndpoints || isMutating}>
                {isLoadingEndpoints ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {endpoints.map((endpoint) => {
              const isSelected = endpoint.name === selectedEndpointName;
              return (
                <button
                  key={endpoint.name}
                  type="button"
                  onClick={() => setSelectedEndpointName(endpoint.name)}
                  className={`rounded-xl border p-4 text-left transition-colors ${isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{endpoint.displayName}</h3>
                        {endpoint.isDefault ? <Badge variant="secondary">Default</Badge> : null}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{endpoint.provider}</p>
                    </div>
                    <HardDrive className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <dl className="mt-4 grid gap-2 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Endpoint</dt>
                      <dd className="truncate">{endpoint.endpoint}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Buckets</dt>
                      <dd>{endpoint.bucketCount}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Host server</dt>
                      <dd>{endpoint.matchedHostServerName || "External / unmanaged"}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Available storage</dt>
                      <dd>{formatBytes(endpoint.availableStorageBytes)}</dd>
                    </div>
                  </dl>
                </button>
              );
            })}
            {!isLoadingEndpoints && endpoints.length === 0 ? (
              <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                No S3 endpoints are configured.
              </div>
            ) : null}
          </CardContent>
        </Card>

        {errorMessage ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <Card className="rounded-none sm:rounded-2xl">
            <CardHeader>
              <CardTitle>Buckets</CardTitle>
              <CardDescription>
                Create and delete buckets on the selected endpoint.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex gap-2">
                <Input
                  placeholder="new-bucket-name"
                  value={newBucketName}
                  onChange={(event) => setNewBucketName(event.target.value)}
                  disabled={!selectedEndpointName || isMutating}
                />
                <Button onClick={handleCreateBucket} disabled={!selectedEndpointName || !newBucketName.trim() || isMutating}>
                  <FolderPlus className="mr-2 h-4 w-4" />
                  Create
                </Button>
              </div>

              <ScrollArea className="h-[420px] pr-4">
                <div className="grid gap-2">
                  {isLoadingBuckets ? <div className="text-sm text-muted-foreground">Loading buckets...</div> : null}
                  {!isLoadingBuckets && buckets.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No buckets found for this endpoint.</div>
                  ) : null}
                  {buckets.map((bucket) => {
                    const isSelected = bucket.name === selectedBucketName;
                    return (
                      <div
                        key={bucket.name}
                        className={`rounded-lg border p-3 ${isSelected ? "border-primary bg-primary/5" : "border-border"}`}
                      >
                        <button
                          type="button"
                          className="w-full text-left"
                          onClick={() => setSelectedBucketName(bucket.name)}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{bucket.name}</span>
                                {bucket.isDefault ? <Badge variant="outline">Default</Badge> : null}
                              </div>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {bucket.objectCount} objects, {formatBytes(bucket.totalSize)}
                              </p>
                            </div>
                          </div>
                        </button>
                        <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                          <span>{bucket.createdAt ? formatDistanceToNow(new Date(bucket.createdAt), { addSuffix: true }) : "Unknown age"}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => void handleDeleteBucket(bucket.name)}
                            disabled={isMutating}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="rounded-none sm:rounded-2xl">
            <CardHeader>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle>{selectedBucketName ? `Objects in ${selectedBucketName}` : "Objects"}</CardTitle>
                  <CardDescription>
                    Upload, download, and delete files inside the selected bucket.
                  </CardDescription>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    placeholder="Prefix filter"
                    value={prefix}
                    onChange={(event) => setPrefix(event.target.value)}
                    disabled={!selectedBucketName || isMutating}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-3 rounded-xl border p-4 lg:grid-cols-[minmax(0,1fr)_220px_auto]">
                <div className="grid gap-2">
                  <label className="text-sm font-medium" htmlFor="s3-upload-input">Upload file</label>
                  <Input
                    id="s3-upload-input"
                    type="file"
                    onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)}
                    disabled={!selectedBucketName || isMutating}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium" htmlFor="s3-upload-key">Object key override</label>
                  <Input
                    id="s3-upload-key"
                    placeholder="folder/example.txt"
                    value={uploadKey}
                    onChange={(event) => setUploadKey(event.target.value)}
                    disabled={!selectedBucketName || isMutating}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleUpload} disabled={!selectedBucketName || !uploadFile || isMutating} className="w-full">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload
                  </Button>
                </div>
              </div>

              <div className="rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Object key</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Last modified</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingObjects ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-muted-foreground">Loading objects...</TableCell>
                      </TableRow>
                    ) : null}
                    {!isLoadingObjects && objects.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-muted-foreground">
                          {selectedBucketName ? "No objects found for this bucket." : "Select a bucket to browse files."}
                        </TableCell>
                      </TableRow>
                    ) : null}
                    {objects.map((object) => (
                      <TableRow key={object.key}>
                        <TableCell className="font-medium">{object.key}</TableCell>
                        <TableCell>{object.contentType || "Unknown"}</TableCell>
                        <TableCell>{formatBytes(object.size)}</TableCell>
                        <TableCell>{object.lastModified ? formatDistanceToNow(new Date(object.lastModified), { addSuffix: true }) : "Unknown"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => void handleDownloadObject(object.key)}
                              disabled={isMutating}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => void handleDeleteObject(object.key)}
                              disabled={isMutating}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
