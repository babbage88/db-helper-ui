import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowRight,
  Cpu,
  HardDrive,
  Loader2,
  MemoryStick,
  Server,
} from "lucide-react";

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
import { HostServersService, type HostServerResponse } from "@/lib/api";
import {
  formatBytes,
  s3AdminApi,
  type S3BucketSummary,
  type S3EndpointSummary,
} from "@/lib/s3-admin-api";

const quickLinks = [
  {
    title: "Nodes",
    href: "/nodes/manage",
    description: "Manage the hosts that back your infrastructure.",
  },
  {
    title: "Object Storage",
    href: "/storage/manage",
    description: "Browse S3-compatible buckets, upload files, and manage objects.",
  },
  {
    title: "Certificates",
    href: "/cert-renew",
    description: "Generate or renew LE certificates.",
  },
  {
    title: "Dev Db Builder",
    href: "/scripts",
    description: "Generate scripts for application databases and users.",
  },
];

const hostTypeChartConfig = {
  count: {
    label: "Hosts",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const bucketChartConfig = {
  size: {
    label: "Used storage",
    color: "var(--chart-2)",
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

type DashboardState = {
  hosts: HostServerResponse[];
  endpoints: S3EndpointSummary[];
  buckets: S3BucketSummary[];
};

type HardwareMetrics = {
  totalMemoryBytes: number | null;
  availableMemoryBytes: number | null;
  totalCpuCores: number | null;
};

export function Dashboard() {
  const [state, setState] = useState<DashboardState>({
    hosts: [],
    endpoints: [],
    buckets: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      setIsLoading(true);
      setError(null);

      try {
        const [hosts, endpoints] = await Promise.all([
          HostServersService.getAllHostServers(),
          s3AdminApi.listEndpoints(),
        ]);

        const bucketResults = await Promise.allSettled(
          endpoints
            .filter((endpoint) => endpoint.manageable)
            .map((endpoint) => s3AdminApi.listBuckets(endpoint.name))
        );
        const buckets = bucketResults.flatMap((result) =>
          result.status === "fulfilled" ? result.value : []
        );

        if (!isMounted) {
          return;
        }

        setState({ hosts, endpoints, buckets });
      } catch (err) {
        if (!isMounted) {
          return;
        }

        setError(
          err instanceof Error ? err.message : "Failed to load dashboard data"
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const hardware = useMemo(() => getHardwareMetrics(state.hosts), [state.hosts]);
  const usedStorageBytes = useMemo(
    () => state.buckets.reduce((total, bucket) => total + bucket.totalSize, 0),
    [state.buckets]
  );
  const availableStorageBytes = useMemo(
    () => sumOptional(state.endpoints.map((endpoint) => endpoint.availableStorageBytes)),
    [state.endpoints]
  );
  const totalObjects = useMemo(
    () => state.buckets.reduce((total, bucket) => total + bucket.objectCount, 0),
    [state.buckets]
  );

  const hostTypeData = useMemo(() => getHostTypeData(state.hosts), [state.hosts]);
  const bucketSizeData = useMemo(
    () =>
      state.buckets
        .map((bucket) => ({
          name: bucket.name,
          size: bytesToGiB(bucket.totalSize),
          sizeLabel: formatBytes(bucket.totalSize),
          fill: "var(--color-size)",
        }))
        .sort((a, b) => b.size - a.size)
        .slice(0, 8),
    [state.buckets]
  );
  const memoryData = useMemo(() => getMemoryData(hardware), [hardware]);

  return (
    <div className="min-h-screen px-3 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Managed hosts, hardware inventory, and S3-compatible storage.
            </p>
          </div>
          {isLoading ? (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading infrastructure data
            </div>
          ) : null}
        </div>

        {error ? (
          <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-lg border px-4 py-3 text-sm">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Managed Hosts"
            value={state.hosts.length.toLocaleString()}
            detail={`${hostTypeData.length} host type${hostTypeData.length === 1 ? "" : "s"}`}
            icon={Server}
          />
          <MetricCard
            title="Total Memory"
            value={formatMetricBytes(hardware.totalMemoryBytes)}
            detail={
              hardware.availableMemoryBytes === null
                ? "Available memory not reported"
                : `${formatBytes(hardware.availableMemoryBytes)} available`
            }
            icon={MemoryStick}
          />
          <MetricCard
            title="CPU Cores"
            value={
              hardware.totalCpuCores === null
                ? "Not reported"
                : hardware.totalCpuCores.toLocaleString()
            }
            detail="Summed from host inventory"
            icon={Cpu}
          />
          <MetricCard
            title="S3 Storage"
            value={formatBytes(usedStorageBytes)}
            detail={
              availableStorageBytes === null
                ? `${state.buckets.length} buckets, ${totalObjects} objects`
                : `${formatBytes(availableStorageBytes)} available`
            }
            icon={HardDrive}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Managed Hosts By Type</CardTitle>
              <CardDescription>
                Host server classifications from the inventory API.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {hostTypeData.length ? (
                <ChartContainer
                  config={hostTypeChartConfig}
                  className="h-[280px] w-full"
                >
                  <BarChart data={hostTypeData} margin={{ left: -20 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                    />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel />}
                    />
                    <Bar dataKey="count" fill="var(--color-count)" radius={6} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <EmptyChartMessage message="No managed host types found." />
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Memory Availability</CardTitle>
              <CardDescription>
                Total and available memory when hosts report hardware inventory.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {memoryData ? (
                <ChartContainer
                  config={memoryChartConfig}
                  className="mx-auto h-[280px] w-full max-w-[320px]"
                >
                  <PieChart>
                    <ChartTooltip
                      cursor={false}
                      content={
                        <ChartTooltipContent
                          hideLabel
                          formatter={(value, name) => (
                            <div className="flex min-w-[10rem] items-center justify-between gap-3">
                              <span className="text-muted-foreground">{name}</span>
                              <span className="font-mono font-medium">
                                {formatBytes(Number(value))}
                              </span>
                            </div>
                          )}
                        />
                      }
                    />
                    <Pie
                      data={memoryData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={64}
                      outerRadius={96}
                      paddingAngle={3}
                    >
                      {memoryData.map((item) => (
                        <Cell key={item.key} fill={item.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
              ) : (
                <EmptyChartMessage message="Memory totals are not reported by host_servers yet." />
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>S3 Bucket Usage</CardTitle>
            <CardDescription>
              Largest buckets across manageable self-hosted S3 endpoints.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {bucketSizeData.length ? (
              <ChartContainer config={bucketChartConfig} className="h-[320px] w-full">
                <BarChart
                  data={bucketSizeData}
                  layout="vertical"
                  margin={{ left: 12, right: 24 }}
                >
                  <CartesianGrid horizontal={false} />
                  <XAxis
                    type="number"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value} GiB`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    width={140}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        hideLabel
                        formatter={(_, __, item) => (
                          <div className="flex min-w-[12rem] items-center justify-between gap-3">
                            <span className="text-muted-foreground">
                              {String(item.payload.name)}
                            </span>
                            <span className="font-mono font-medium">
                              {String(item.payload.sizeLabel)}
                            </span>
                          </div>
                        )}
                      />
                    }
                  />
                  <Bar dataKey="size" fill="var(--color-size)" radius={6} />
                </BarChart>
              </ChartContainer>
            ) : (
              <EmptyChartMessage message="No bucket usage data found." />
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((component) => (
            <Card key={component.href} className="flex flex-col justify-between">
              <CardHeader>
                <CardTitle>{component.title}</CardTitle>
                <CardDescription>{component.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link to={component.href}>
                    Open <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  detail,
  icon: Icon,
}: {
  title: string;
  value: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="text-muted-foreground h-4 w-4" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-muted-foreground mt-1 text-xs">{detail}</p>
      </CardContent>
    </Card>
  );
}

function EmptyChartMessage({ message }: { message: string }) {
  return (
    <div className="border-border/60 bg-muted/20 text-muted-foreground flex h-[280px] items-center justify-center rounded-lg border border-dashed px-6 text-center text-sm">
      {message}
    </div>
  );
}

function getHostTypeData(hosts: HostServerResponse[]) {
  const counts = new Map<string, number>();

  for (const host of hosts) {
    const types = host.host_server_types?.length
      ? host.host_server_types
      : [{ name: "Unclassified" }];

    for (const type of types) {
      const name = type.name || "Unclassified";
      counts.set(name, (counts.get(name) || 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

function getHardwareMetrics(hosts: HostServerResponse[]): HardwareMetrics {
  const memoryTotals = hosts.map((host) =>
    getFirstNumber(host, [
      "total_memory_bytes",
      "memory_total_bytes",
      "totalMemoryBytes",
      "memoryTotalBytes",
    ])
  );
  const memoryAvailable = hosts.map((host) =>
    getFirstNumber(host, [
      "available_memory_bytes",
      "memory_available_bytes",
      "availableMemoryBytes",
      "memoryAvailableBytes",
    ])
  );
  const cpuCores = hosts.map((host) =>
    getFirstNumber(host, [
      "cpu_cores",
      "total_cpu_cores",
      "cpuCores",
      "totalCpuCores",
    ])
  );

  return {
    totalMemoryBytes: sumOptional(memoryTotals),
    availableMemoryBytes: sumOptional(memoryAvailable),
    totalCpuCores: sumOptional(cpuCores),
  };
}

function getMemoryData(hardware: HardwareMetrics) {
  if (
    hardware.totalMemoryBytes === null ||
    hardware.availableMemoryBytes === null ||
    hardware.totalMemoryBytes <= 0
  ) {
    return null;
  }

  const available = Math.max(0, hardware.availableMemoryBytes);
  const used = Math.max(0, hardware.totalMemoryBytes - available);

  return [
    { key: "used", name: "Used", value: used, fill: "var(--color-used)" },
    {
      key: "available",
      name: "Available",
      value: available,
      fill: "var(--color-available)",
    },
  ];
}

function getFirstNumber(
  source: Record<string, unknown>,
  keys: string[]
): number | null {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }

  return null;
}

function sumOptional(values: Array<number | null | undefined>) {
  const numbers = values.filter(
    (value): value is number =>
      typeof value === "number" && Number.isFinite(value)
  );

  if (!numbers.length) {
    return null;
  }

  return numbers.reduce((total, value) => total + value, 0);
}

function formatMetricBytes(value: number | null) {
  return value === null ? "Not reported" : formatBytes(value);
}

function bytesToGiB(value: number) {
  return Number((value / 1024 / 1024 / 1024).toFixed(2));
}
