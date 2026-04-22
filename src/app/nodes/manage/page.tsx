"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";
import { Cpu, HardDrive, MemoryStick, Plus, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { HostServersService } from "@/lib/api/services/HostServersService";
import { SshKeyHostMappingsService } from "@/lib/api/services/SshKeyHostMappingsService";
import { TokenService } from "@/lib/tokenManager";
import {
  hostStatsApi,
  type HostResourceStatsSummary,
} from "@/lib/host-stats-api";
import { formatBytes } from "@/lib/s3-admin-api";
import { AddNodeDialog } from "./add-node-dialog";
import { DataTable } from "./data-table";
import type { Node } from "./columns";

const hostTypeChartConfig = {
  count: {
    label: "Nodes",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const cpuChartConfig = {
  cpuCores: {
    label: "CPU cores",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

const memoryChartConfig = {
  used: {
    label: "Used",
    color: "var(--chart-1)",
  },
  available: {
    label: "Available",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export default function ManageNodesPage() {
  const [nodes, setNodes] = React.useState<Node[]>([]);
  const [hostStats, setHostStats] = React.useState<HostResourceStatsSummary | null>(null);
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

      const [allServers, userMappings, statsSummary] = await Promise.all([
        HostServersService.getAllHostServers(),
        SshKeyHostMappingsService.getSshKeyHostMappingsByUserId(userInfo.userId),
        hostStatsApi.getSummary().catch(() => null),
      ]);

      const userMappingsMap = new Map(userMappings.map(m => [m.hostServerId, m]));
      const statsByHostId = new Map(
        (statsSummary?.hosts || []).map((host) => [host.hostServerId, host])
      );
      // Removed unused: hostTypeMap, platformTypeMap, hostTypeMappings, platformTypeMappings
      // For demo, assume server.host_server_type_ids and server.platform_type_ids exist (adjust if not)
      const accessibleNodes = allServers
        .filter(server => server.id && userMappingsMap.has(server.id))
        .map(server => {
          const mapping = userMappingsMap.get(server.id!);
          const hostServerTypeIds = Array.isArray(server.host_server_types)
            ? server.host_server_types.map((t: any) => t.id)
            : [];
          const hostServerTypeNames = Array.isArray(server.host_server_types)
            ? server.host_server_types.map((t: any) => t.name)
            : [];
          const platformTypeIds = Array.isArray(server.platform_types)
            ? server.platform_types.map((t: any) => t.id)
            : [];
          const platformTypeNames = Array.isArray(server.platform_types)
            ? server.platform_types.map((t: any) => t.name)
            : [];
          return {
            ID: server.id || "",
            Hostname: server.hostname || "",
            IpAddress: server.ip_address || "",
            hostServerTypeIds,
            hostServerTypeNames,
            platformTypeIds,
            platformTypeNames,
            LastModified: server.last_modified,
            Username: mapping?.hostserverUsername || server.username,
            mappingId: mapping?.id,
            stats: server.id ? statsByHostId.get(server.id) : undefined,
          };
        });
      setNodes(accessibleNodes as Node[]);
      setHostStats(statsSummary);
    } catch (error) {
      console.error("Failed to fetch nodes:", error);
      setNodes([]);
      setHostStats(null);
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
    <div className="w-full space-y-4 px-2 py-4 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Managed Nodes</h1>
          <p className="text-sm text-muted-foreground">
            Manage your SSH-accessible servers and deployment targets
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Add Node
        </Button>
      </div>

      {!isLoading && <NodeOverviewCharts nodes={nodes} hostStats={hostStats} />}

      <Card className="w-full rounded-none sm:rounded-lg">
        <CardHeader>
          <CardTitle>Node Inventory</CardTitle>
          <CardDescription>
            SSH reachability, classifications, and access mappings for managed nodes.
          </CardDescription>
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

function NodeOverviewCharts({
  nodes,
  hostStats,
}: {
  nodes: Node[];
  hostStats: HostResourceStatsSummary | null;
}) {
  const typeData = React.useMemo(() => {
    const counts = new Map<string, number>();
    nodes.forEach((node) => {
      const names = node.hostServerTypeNames.length
        ? node.hostServerTypeNames
        : ["Unclassified"];
      names.forEach((name) => counts.set(name, (counts.get(name) || 0) + 1));
    });

    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [nodes]);

  const capacityData = React.useMemo(() => {
    const labels: Record<string, string> = {
      physical: "Physical",
      hypervisor: "Hypervisor",
      guest: "VM/LXC",
      unclassified: "Unclassified",
    };
    const colors: Record<string, string> = {
      physical: "var(--chart-1)",
      hypervisor: "var(--chart-2)",
      guest: "var(--chart-3)",
      unclassified: "var(--chart-4)",
    };
    const counts = new Map<string, number>();

    (hostStats?.hosts || []).forEach((host) => {
      counts.set(host.capacityRole, (counts.get(host.capacityRole) || 0) + 1);
    });

    return Array.from(counts.entries()).map(([role, value]) => ({
      role,
      name: labels[role] || role,
      value,
      fill: colors[role] || "var(--chart-5)",
    }));
  }, [hostStats]);

  const cpuData = React.useMemo(
    () =>
      (hostStats?.hosts || [])
        .filter((host) => host.status === "ok" && host.cpuCores)
        .map((host) => ({
          hostname: host.hostname || host.ipAddress,
          cpuCores: host.cpuCores || 0,
          role: host.capacityRole,
        }))
        .sort((a, b) => b.cpuCores - a.cpuCores)
        .slice(0, 8),
    [hostStats]
  );

  const memoryData = React.useMemo(
    () =>
      (hostStats?.hosts || [])
        .filter((host) => host.status === "ok" && host.memoryTotalBytes)
        .map((host) => {
          const total = host.memoryTotalBytes || 0;
          const available = host.memoryAvailableBytes || 0;
          return {
            hostname: host.hostname || host.ipAddress,
            used: bytesToGiB(Math.max(total - available, 0)),
            available: bytesToGiB(available),
            totalLabel: formatBytes(total),
          };
        })
        .sort((a, b) => b.used + b.available - (a.used + a.available))
        .slice(0, 8),
    [hostStats]
  );

  const reachableLabel =
    hostStats === null
      ? "Unavailable"
      : `${hostStats.reachableHostCount.toLocaleString()} / ${hostStats.hostCount.toLocaleString()}`;

  return (
    <div className="grid gap-4 xl:grid-cols-4">
      <Card className="xl:col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Server className="h-4 w-4 text-muted-foreground" />
            Node Mix
          </CardTitle>
          <CardDescription>{reachableLabel} nodes reported live stats</CardDescription>
        </CardHeader>
        <CardContent>
          {capacityData.length ? (
            <ChartContainer config={{ value: { label: "Nodes" } }} className="mx-auto h-[210px] w-full">
              <PieChart>
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={capacityData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={48}
                  outerRadius={78}
                  paddingAngle={3}
                >
                  {capacityData.map((item) => (
                    <Cell key={item.role} fill={item.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          ) : (
            <EmptyChart icon={Server} message="No live node roles yet." />
          )}
        </CardContent>
      </Card>

      <Card className="xl:col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Cpu className="h-4 w-4 text-muted-foreground" />
            CPU By Node
          </CardTitle>
          <CardDescription>Top nodes by reported core count</CardDescription>
        </CardHeader>
        <CardContent>
          {cpuData.length ? (
            <ChartContainer config={cpuChartConfig} className="h-[210px] w-full">
              <BarChart data={cpuData} margin={{ left: -20, right: 12 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="hostname" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="cpuCores" fill="var(--color-cpuCores)" radius={5} />
              </BarChart>
            </ChartContainer>
          ) : (
            <EmptyChart icon={Cpu} message="CPU stats are not available." />
          )}
        </CardContent>
      </Card>

      <Card className="xl:col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <MemoryStick className="h-4 w-4 text-muted-foreground" />
            Memory By Node
          </CardTitle>
          <CardDescription>Used and available memory in GiB</CardDescription>
        </CardHeader>
        <CardContent>
          {memoryData.length ? (
            <ChartContainer config={memoryChartConfig} className="h-[210px] w-full">
              <BarChart data={memoryData} margin={{ left: -20, right: 12 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="hostname" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      hideLabel
                      formatter={(value, name) => (
                        <div className="flex min-w-[9rem] items-center justify-between gap-3">
                          <span className="text-muted-foreground">{name}</span>
                          <span className="font-mono font-medium">{Number(value).toFixed(1)} GiB</span>
                        </div>
                      )}
                    />
                  }
                />
                <Bar dataKey="used" stackId="memory" fill="var(--color-used)" radius={[5, 5, 0, 0]} />
                <Bar dataKey="available" stackId="memory" fill="var(--color-available)" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ChartContainer>
          ) : (
            <EmptyChart icon={MemoryStick} message="Memory stats are not available." />
          )}
        </CardContent>
      </Card>

      <Card className="xl:col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <HardDrive className="h-4 w-4 text-muted-foreground" />
            Classification
          </CardTitle>
          <CardDescription>Managed node types from inventory</CardDescription>
        </CardHeader>
        <CardContent>
          {typeData.length ? (
            <ChartContainer config={hostTypeChartConfig} className="h-[210px] w-full">
              <BarChart data={typeData} layout="vertical" margin={{ left: 12, right: 12 }}>
                <CartesianGrid horizontal={false} />
                <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={112}
                  tickLine={false}
                  axisLine={false}
                />
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={5} />
              </BarChart>
            </ChartContainer>
          ) : (
            <EmptyChart icon={HardDrive} message="No node classifications yet." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyChart({
  icon: Icon,
  message,
}: {
  icon: React.ComponentType<{ className?: string }>;
  message: string;
}) {
  return (
    <div className="flex h-[210px] flex-col items-center justify-center gap-2 rounded-md border border-dashed text-center text-sm text-muted-foreground">
      <Icon className="h-5 w-5" />
      <span>{message}</span>
    </div>
  );
}

function bytesToGiB(value: number) {
  return value / 1024 / 1024 / 1024;
}
