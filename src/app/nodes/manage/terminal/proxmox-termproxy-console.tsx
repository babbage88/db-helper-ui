"use client";

import * as React from "react";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { Terminal } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";
import "./terminal-overrides.css";
import { cn } from "@/lib/utils";

type ProxmoxTermProxyConsoleProps = {
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
  return `${protocol}//${window.location.host}/api/v1/proxmox/container/${vmid}/console/websocket?${query.toString()}`;
}

export function ProxmoxTermProxyConsole({
  hostServerId,
  vmid,
  node,
  title,
  onClose,
}: ProxmoxTermProxyConsoleProps) {
  const terminalRef = React.useRef<HTMLDivElement>(null);
  const termRef = React.useRef<Terminal | null>(null);
  const fitRef = React.useRef<FitAddon | null>(null);
  const wsRef = React.useRef<WebSocket | null>(null);
  const [state, setState] = React.useState<"connecting" | "connected" | "disconnected">("connecting");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!terminalRef.current) return;

    const terminal = new Terminal({
      cursorBlink: true,
      fontSize: 16,
      fontFamily: "Monaco, Menlo, 'Ubuntu Mono', monospace",
      scrollback: 5000,
      theme: {
        background: "#1e1e1e",
        foreground: "#ffffff",
        cursor: "#ffffff",
      },
    });
    const fit = new FitAddon();
    terminal.loadAddon(fit);
    terminal.loadAddon(new WebLinksAddon());
    terminal.open(terminalRef.current);
    queueMicrotask(() => fit.fit());

    termRef.current = terminal;
    fitRef.current = fit;

    terminal.writeln("Connecting to Proxmox container console...");
    terminal.writeln("");

    const ws = new WebSocket(buildConsoleSocketUrl(hostServerId, vmid, node));
    ws.binaryType = "arraybuffer";

    ws.onopen = () => {
      setState("connected");
      terminal.clear();
    };

    ws.onmessage = (event) => {
      if (typeof event.data === "string") {
        terminal.write(event.data);
        return;
      }
      const bytes = event.data instanceof ArrayBuffer ? new Uint8Array(event.data) : event.data;
      terminal.write(new TextDecoder().decode(bytes));
    };

    ws.onerror = () => {
      setError("Failed to connect to the Proxmox container console.");
      setState("disconnected");
    };

    ws.onclose = () => {
      setState("disconnected");
    };

    terminal.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });

    const resize = () => fit.fit();
    const observer = new ResizeObserver(resize);
    observer.observe(terminalRef.current);
    window.addEventListener("resize", resize);

    wsRef.current = ws;

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", resize);
      ws.close();
      terminal.dispose();
    };
  }, [hostServerId, node, vmid]);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-border/70 bg-black/60 p-6 text-sm text-red-300">
        {error}
      </div>
    );
  }

  return (
    <div className={cn("bg-black flex h-full min-h-[360px] flex-col rounded-2xl border border-border/70")}>
      <div className="db-terminal-header">
        <div className="window-controls">
          <div className="red" />
          <div className="yellow" />
          <div className="green" />
        </div>
        <div>
          {title} • {state === "connecting" ? "Connecting..." : state === "connected" ? "Connected" : "Disconnected"}
        </div>
        <button onClick={onClose} className="close-btn" aria-label="Close console">
          ✕
        </button>
      </div>
      <div className="flex-1 min-h-0">
        <div ref={terminalRef} className="h-full w-full" />
      </div>
    </div>
  );
}
