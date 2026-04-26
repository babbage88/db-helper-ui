"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type ProxmoxVncConsoleProps = {
  hostServerId: string;
  vmid: number;
  node: string;
  title: string;
  onClose: () => void;
};

function buildConsoleSocketUrl(hostServerId: string, vmid: number, node: string) {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const query = new URLSearchParams({
    host_server_id: hostServerId,
    node,
  });
  return `${protocol}//${window.location.host}/api/v1/proxmox/vm/${vmid}/console/websocket?${query.toString()}`;
}

export function ProxmoxVncConsole({
  hostServerId,
  vmid,
  node,
  title,
  onClose,
}: ProxmoxVncConsoleProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const rfbRef = React.useRef<any>(null);
  const [status, setStatus] = React.useState("Connecting...");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function connect() {
      if (!containerRef.current) return;
      try {
        const module = await import("@novnc/novnc/lib/rfb");
        if (cancelled || !containerRef.current) return;

        const RFB = module.default;
        const rfb = new RFB(
          containerRef.current,
          buildConsoleSocketUrl(hostServerId, vmid, node),
          { shared: true }
        );
        rfb.scaleViewport = true;
        rfb.resizeSession = true;
        rfb.background = "#000000";
        rfb.clipViewport = false;
        rfb.focusOnClick = true;

        rfb.addEventListener("connect", () => {
          setStatus("Connected");
          setError(null);
        });
        rfb.addEventListener("disconnect", (event: any) => {
          setStatus("Disconnected");
          if (!cancelled && !event?.detail?.clean) {
            setError(event?.detail?.reason || "The Proxmox VM console disconnected unexpectedly.");
          }
        });
        rfb.addEventListener("securityfailure", (event: any) => {
          setError(event?.detail?.reason || "The Proxmox VM console failed security negotiation.");
        });
        rfb.addEventListener("credentialsrequired", () => {
          setError("The Proxmox VM console requested additional credentials.");
        });

        rfbRef.current = rfb;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load the Proxmox VM console.");
        setStatus("Disconnected");
      }
    }

    void connect();

    return () => {
      cancelled = true;
      if (rfbRef.current) {
        rfbRef.current.disconnect();
        rfbRef.current = null;
      }
    };
  }, [hostServerId, node, vmid]);

  return (
    <div className={cn("bg-black flex h-full min-h-[360px] flex-col overflow-hidden rounded-2xl border border-border/70")}>
      <div className="db-terminal-header">
        <div className="window-controls">
          <div className="red" />
          <div className="yellow" />
          <div className="green" />
        </div>
        <div>
          {title} • {status}
        </div>
        <button onClick={onClose} className="close-btn" aria-label="Close console">
          ✕
        </button>
      </div>
      {error ? (
        <div className="flex flex-1 items-center justify-center p-6 text-sm text-red-300">{error}</div>
      ) : null}
      <div
        ref={containerRef}
        className={cn("min-h-0 flex-1 bg-black", error && "hidden")}
      />
    </div>
  );
}
