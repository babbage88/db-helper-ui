"use client";

import * as React from "react";
import { X } from "lucide-react";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { Terminal } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";
import "./terminal-overrides.css";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ProxmoxTermProxyConsoleProps = {
  hostServerId: string;
  vmid: number;
  node: string;
  title: string;
  onClose: () => void;
  variant?: "embedded" | "focused";
};

function buildConsoleSocketUrl(hostServerId: string, vmid: number, node: string) {
  const apiBase = new URL(import.meta.env.VITE_API_WEB_INFRA_URL);
  const protocol = apiBase.protocol === "https:" ? "wss:" : "ws:";
  const query = new URLSearchParams({
    host_server_id: hostServerId,
    node,
  });
  return `${protocol}//${apiBase.host}/api/v1/proxmox/container/${vmid}/console/websocket?${query.toString()}`;
}

function encodeTerminalDataFrame(data: string) {
  return `0:${new TextEncoder().encode(data).length}:${data}`;
}

function encodeTerminalResizeFrame(cols: number, rows: number) {
  return `1:${cols}:${rows}:`;
}

export function ProxmoxTermProxyConsole({
  hostServerId,
  vmid,
  node,
  title,
  onClose,
  variant = "embedded",
}: ProxmoxTermProxyConsoleProps) {
  const terminalRef = React.useRef<HTMLDivElement>(null);
  const termRef = React.useRef<Terminal | null>(null);
  const fitRef = React.useRef<FitAddon | null>(null);
  const wsRef = React.useRef<WebSocket | null>(null);
  const [state, setState] = React.useState<"connecting" | "connected" | "disconnected">("connecting");
  const [error, setError] = React.useState<string | null>(null);
  const isFocused = variant === "focused";
  const [showNotice, setShowNotice] = React.useState(isFocused);

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

    const ws = new WebSocket(buildConsoleSocketUrl(hostServerId, vmid, node), "binary");
    ws.binaryType = "arraybuffer";

    ws.onopen = () => {
      setState("connected");
      terminal.clear();
      ws.send(encodeTerminalResizeFrame(terminal.cols, terminal.rows));
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
        ws.send(encodeTerminalDataFrame(data));
      }
    });

    const resize = () => {
      fit.fit();
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(encodeTerminalResizeFrame(terminal.cols, terminal.rows));
      }
    };
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
      <div
        className={cn(
          "flex h-full w-full items-center justify-center bg-black/60 p-6 text-sm text-red-300",
          !isFocused && "rounded-2xl border border-border/70"
        )}
      >
        {error}
      </div>
    );
  }

  if (isFocused) {
    return (
      <div className="relative h-screen w-screen overflow-hidden bg-black">
        {showNotice ? (
          <Alert className="absolute right-4 top-20 z-10 w-[360px] border-white/10 bg-black/80 text-white shadow-xl backdrop-blur-md">
            <div className="absolute right-3 top-3">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-neutral-400 hover:bg-white/10 hover:text-white"
                onClick={() => setShowNotice(false)}
                aria-label="Dismiss console notice"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <AlertTitle className="pr-8">{title}</AlertTitle>
            <AlertDescription>
              <p>Status: {state === "connecting" ? "Connecting..." : state === "connected" ? "Connected" : "Disconnected"}</p>
              <p>The console is active in this focused popout window.</p>
            </AlertDescription>
          </Alert>
        ) : null}
        <div ref={terminalRef} className="h-screen w-screen" />
      </div>
    );
  }

  return (
    <div className="relative flex h-full w-full min-h-[360px] flex-col rounded-2xl border border-border/70 bg-black">
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
