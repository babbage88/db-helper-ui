"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type ProxmoxVncConsoleProps = {
  hostServerId: string;
  vmid: number;
  node: string;
  title: string;
  onClose: () => void;
  variant?: "embedded" | "focused";
};

type VmConsoleSession = {
  port: number;
  ticket: string;
  user?: string;
  password?: string;
};

function buildConsoleSocketUrl(hostServerId: string, vmid: number, node: string, session: VmConsoleSession) {
  const apiBase = new URL(import.meta.env.VITE_API_WEB_INFRA_URL);
  const protocol = apiBase.protocol === "https:" ? "wss:" : "ws:";
  const query = new URLSearchParams({
    host_server_id: hostServerId,
    node,
    port: String(session.port),
    ticket: session.ticket,
  });
  return `${protocol}//${apiBase.host}/api/v1/proxmox/vm/${vmid}/console/websocket?${query.toString()}`;
}

function waitForElementSize(element: HTMLElement, isCancelled: () => boolean) {
  return new Promise<boolean>((resolve) => {
    if (element.clientWidth > 0 && element.clientHeight > 0) {
      resolve(true);
      return;
    }

    let frameId = 0;
    let observer: ResizeObserver;
    const finish = (ready: boolean) => {
      observer.disconnect();
      cancelAnimationFrame(frameId);
      resolve(ready);
    };
    observer = new ResizeObserver(() => {
      if (element.clientWidth > 0 && element.clientHeight > 0) {
        finish(true);
      }
    });

    const checkNextFrame = () => {
      if (isCancelled()) {
        finish(false);
        return;
      }
      if (element.clientWidth > 0 && element.clientHeight > 0) {
        finish(true);
        return;
      }
      frameId = requestAnimationFrame(checkNextFrame);
    };

    observer.observe(element);
    frameId = requestAnimationFrame(checkNextFrame);
  });
}

export function ProxmoxVncConsole({
  hostServerId,
  vmid,
  node,
  title,
  onClose,
  variant = "embedded",
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
        const container = containerRef.current;
        const hasSize = await waitForElementSize(container, () => cancelled);
        if (!hasSize || cancelled || !containerRef.current) return;

        const apiBase = new URL(import.meta.env.VITE_API_WEB_INFRA_URL);
        const sessionUrl = new URL(`/api/v1/proxmox/vm/${vmid}/console/session`, apiBase);
        sessionUrl.search = new URLSearchParams({
          host_server_id: hostServerId,
          node,
        }).toString();
        const sessionResponse = await fetch(
          sessionUrl.toString(),
          {
            credentials: "include",
          }
        );
        if (!sessionResponse.ok) {
          throw new Error("Failed to create the Proxmox VM console session.");
        }
        const session = (await sessionResponse.json()) as VmConsoleSession;
        if (!session.ticket || !session.port) {
          throw new Error("The Proxmox VM console session was missing required credentials.");
        }

        const module = await import("@novnc/novnc/lib/rfb");
        if (cancelled || !containerRef.current) return;

        container.innerHTML = "";

        const RFB = module.default;
        const rfb = new RFB(
          container,
          buildConsoleSocketUrl(hostServerId, vmid, node, session),
          {
            credentials: { password: session.password || session.ticket },
            shared: true,
          }
        );
        rfb.background = "#000000";
        rfb.focusOnClick = true;
        rfb.scaleViewport = true;
        rfb.resizeSession = true;
        rfb.clipViewport = false;
        rfb.viewOnly = false;

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
          rfb.sendCredentials({ password: session.password || session.ticket });
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
    <div
      className={cn(
        "relative flex flex-col bg-black text-white",
        variant === "focused" ? "h-screen w-screen overflow-hidden" : "h-full min-h-[360px] overflow-hidden rounded-2xl border border-border/70"
      )}
    >
      {variant === "embedded" ? (
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
      ) : null}

      {variant === "focused" ? (
        <>
          <div className="pointer-events-none absolute right-5 top-20 z-10 rounded-full border border-white/10 bg-black/50 px-3 py-1 text-sm text-neutral-300 backdrop-blur-sm">
            {title} • {status}
          </div>
        </>
      ) : null}

      {error ? (
        <div className="flex h-full flex-1 items-center justify-center p-6 text-sm text-red-300">{error}</div>
      ) : (
        <div
          ref={containerRef}
          className={cn(
            "min-h-0 flex-1 bg-black",
            variant === "focused" ? "h-full w-full" : ""
          )}
        />
      )}
    </div>
  );
}
