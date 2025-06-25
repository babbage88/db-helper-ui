"use client";

import * as React from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import "@xterm/xterm/css/xterm.css";
import { SshConnectionService } from "@/lib/api/services/SshConnectionService";

interface TerminalProps {
  nodeId: string;
  hostname: string;
  ipAddress: string;
  username: string;
  onClose: () => void;
}

export function TerminalComponent({ nodeId, hostname, ipAddress, username, onClose }: TerminalProps) {
  const terminalRef = React.useRef<HTMLDivElement>(null);
  const terminalInstance = React.useRef<Terminal | null>(null);
  const fitAddon = React.useRef<FitAddon | null>(null);
  const websocketRef = React.useRef<WebSocket | null>(null);
  const connectionIdRef = React.useRef<string | null>(null);
  const [isConnected, setIsConnected] = React.useState(false);
  const [isConnecting, setIsConnecting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize terminal
    const terminal = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: "Monaco, Menlo, 'Ubuntu Mono', monospace",
      theme: {
        background: '#1e1e1e',
        foreground: '#ffffff',
        cursor: '#ffffff',
        black: '#000000',
        red: '#cd3131',
        green: '#0dbc79',
        yellow: '#e5e510',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#11a8cd',
        white: '#e5e5e5',
        brightBlack: '#666666',
        brightRed: '#f14c4c',
        brightGreen: '#23d18b',
        brightYellow: '#f5f543',
        brightBlue: '#3b8eea',
        brightMagenta: '#d670d6',
        brightCyan: '#29b8db',
        brightWhite: '#ffffff',
      },
      rows: 30,
      cols: 100,
    });

    // Add addons
    const fit = new FitAddon();
    const webLinks = new WebLinksAddon();
    
    terminal.loadAddon(fit);
    terminal.loadAddon(webLinks);

    // Open terminal
    terminal.open(terminalRef.current);
    fit.fit();

    // Store references
    terminalInstance.current = terminal;
    fitAddon.current = fit;

    // Handle window resize
    const handleResize = () => {
      if (fitAddon.current) {
        fitAddon.current.fit();
        // Send resize event to WebSocket if connected
        if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
          const dims = fitAddon.current.proposeDimensions();
          if (dims) {
            websocketRef.current.send(JSON.stringify({
              type: 'resize',
              cols: dims.cols,
              rows: dims.rows
            }));
          }
        }
      }
    };

    window.addEventListener('resize', handleResize);

    // Initialize connection
    initializeConnection();

    return () => {
      window.removeEventListener('resize', handleResize);
      cleanupConnection();
      if (terminalInstance.current) {
        terminalInstance.current.dispose();
      }
    };
  }, [nodeId, hostname, ipAddress, username]);

  const cleanupConnection = async () => {
    // Close WebSocket connection
    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
    }

    // Close SSH connection on server
    if (connectionIdRef.current) {
      try {
        await SshConnectionService.closeSshConnection(connectionIdRef.current);
      } catch (error) {
        console.error('Failed to close SSH connection:', error);
      }
      connectionIdRef.current = null;
    }
  };

  const initializeConnection = async () => {
    if (!terminalInstance.current) return;

    setIsConnecting(true);
    setError(null);

    try {
      // Display connection message
      terminalInstance.current.writeln(`Connecting to ${username}@${ipAddress} (${hostname})...`);
      terminalInstance.current.writeln('');

      // Create SSH connection
      const connectionResponse = await SshConnectionService.createSshConnection({
        hostServerId: nodeId,
        username: username
      });

      if (!connectionResponse.success) {
        throw new Error(connectionResponse.error || 'Failed to establish SSH connection');
      }

      connectionIdRef.current = connectionResponse.connectionId;

      // Connect to WebSocket
      const wsUrl = connectionResponse.websocketUrl;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        if (terminalInstance.current) {
          terminalInstance.current.writeln(`Connected to ${hostname} (${ipAddress})`);
          terminalInstance.current.writeln(`Welcome ${username}!`);
          terminalInstance.current.writeln('');
        }
        setIsConnected(true);
        setIsConnecting(false);

        // Send initial terminal size
        if (fitAddon.current) {
          const dims = fitAddon.current.proposeDimensions();
          if (dims) {
            ws.send(JSON.stringify({
              type: 'resize',
              cols: dims.cols,
              rows: dims.rows
            }));
          }
        }
      };

      ws.onmessage = (event) => {
        if (terminalInstance.current) {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'data') {
              terminalInstance.current.write(data.data);
            } else if (data.type === 'error') {
              terminalInstance.current.writeln(`\r\nError: ${data.message}`);
            }
          } catch (error) {
            // If not JSON, treat as raw data
            terminalInstance.current.write(event.data);
          }
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('WebSocket connection failed');
        setIsConnecting(false);
        if (terminalInstance.current) {
          terminalInstance.current.writeln('Connection failed. Please try again.');
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        if (terminalInstance.current) {
          terminalInstance.current.writeln('\r\nConnection closed.');
        }
      };

      websocketRef.current = ws;

      // Set up terminal input handling
      terminalInstance.current.onData((data) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'input',
            data: data
          }));
        }
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
      setIsConnecting(false);
      if (terminalInstance.current) {
        terminalInstance.current.writeln('Connection failed. Please try again.');
      }
    }
  };

  const handleClose = () => {
    cleanupConnection();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Terminal Header */}
      <div className="flex items-center justify-between bg-muted px-4 py-2 border-b">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium">
            {username}@{hostname} ({ipAddress})
          </span>
          {isConnecting && (
            <span className="text-sm text-muted-foreground">Connecting...</span>
          )}
          {isConnected && (
            <span className="text-sm text-green-600">Connected</span>
          )}
          {error && (
            <span className="text-sm text-red-600">Error: {error}</span>
          )}
        </div>
        <button
          onClick={handleClose}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Terminal Content */}
      <div className="flex-1 p-2">
        <div 
          ref={terminalRef} 
          className="w-full h-full bg-[#1e1e1e] rounded"
        />
      </div>

      {/* Connection Status */}
      {!isConnected && !isConnecting && error && (
        <div className="bg-destructive/10 border border-destructive/20 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-destructive">
              Connection failed: {error}
            </span>
            <button
              onClick={initializeConnection}
              className="text-sm bg-primary text-primary-foreground px-3 py-1 rounded hover:bg-primary/90"
            >
              Retry
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 