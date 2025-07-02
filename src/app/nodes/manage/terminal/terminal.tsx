"use client";

import * as React from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import "@xterm/xterm/css/xterm.css";
import "./terminal-overrides.css";
import { SshService } from "@/lib/api/services/SshService";
import { TokenService } from '@/lib/tokenManager';

interface TerminalProps {
  nodeId: string;
  hostname: string;
  ipAddress: string;
  username: string;
  onClose: () => void;
}

interface SshConnectionWithSizeParams {
  hostServerId: string;
  username: string;
  columns?: number;
  rows?: number;
}

// Helper to refresh token and retry SSH connect
async function createSshConnectionWithRefresh(params: SshConnectionWithSizeParams) {
  try {
    return await SshService.createSshConnection(params);
  } catch (err: any) {
    // If 401, try to refresh and retry
    if (err?.status === 401 || err?.response?.status === 401) {
      // Call your refresh endpoint and update tokens
      const refreshToken = TokenService.getRefreshToken();
      if (refreshToken) {
        // You may need to call your refresh endpoint here
        // Example:
        const response = await fetch(`${import.meta.env.VITE_API_WEB_INFRA_URL}/token/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (response.ok) {
          const data = await response.json();
          await TokenService.setAccessToken(data.accessToken);
          await TokenService.setRefreshToken(data.refreshToken);
          // Retry the SSH connection
          return await SshService.createSshConnection(params);
        } else {
          // TokenService.clearTokens();
          // TokenService.clearUserInfo();
        }
      }
    }
    throw err;
  }
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
  const hasClosedRef = React.useRef(false);

  const cleanupConnection = React.useCallback(async () => {
    if (hasClosedRef.current) return;
    hasClosedRef.current = true;
    // Close WebSocket connection
    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
    }

    // Close SSH connection on server
    if (connectionIdRef.current) {
      try {
        await SshService.closeSshConnection(connectionIdRef.current);
      } catch (error) {
        console.error('Failed to close SSH connection:', error);
      }
      connectionIdRef.current = null;
    }
  }, []);

  const initializeConnection = React.useCallback(async () => {
    if (!terminalInstance.current) return;

    setIsConnecting(true);
    setError(null);
    let keepAliveInterval: NodeJS.Timeout | null = null;

    try {
      // Display connection message
      terminalInstance.current.writeln(`Connecting to ${username}@${ipAddress} (${hostname})...`);
      terminalInstance.current.writeln('');

      // Get initial terminal size (robust dynamic sizing)
      let initialCols = 80;
      let initialRows = 24;
      if (fitAddon.current) {
        const dims = fitAddon.current.proposeDimensions();
        if (dims) {
          initialCols = Math.min(Math.max(dims.cols, 40), 120); // Clamp between 40 and 120
          initialRows = Math.min(Math.max(dims.rows, 10), 40);  // Clamp between 10 and 40
        }
      }
      console.log('Initial cols/rows sent to backend:', initialCols, initialRows);

      // Create SSH connection - the backend should get connection info from session/context
      // or we may need to modify the backend to accept parameters
      const connectionResponse = await createSshConnectionWithRefresh({
        hostServerId: nodeId,
        username: username,
        columns: initialCols,
        rows: initialRows,
      });

      if (!connectionResponse.success) {
        throw new Error(connectionResponse.error || 'Failed to establish SSH connection');
      }

      if (!connectionResponse.connectionId) {
        throw new Error('No connection ID received from server');
      }

      connectionIdRef.current = connectionResponse.connectionId;

      // Connect to WebSocket
      let wsUrl = connectionResponse.websocketUrl;
      if (!wsUrl) {
        throw new Error('No WebSocket URL received from server');
      }
      // Always get the latest JWT from storage right before opening the WebSocket
      let jwt = await TokenService.getAccessToken();
      if (jwt) {
        const urlObj = new URL(wsUrl);
        urlObj.searchParams.set('token', jwt);
        wsUrl = urlObj.toString();
      }
      console.log("WebSocket URL (with latest token):", wsUrl);
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        if (terminalInstance.current) {
          terminalInstance.current.writeln(`Connected to ${hostname} (${ipAddress})`);
          terminalInstance.current.writeln(`Welcome ${username}!`);
          terminalInstance.current.writeln('');
        }
        setIsConnected(true);
        setIsConnecting(false);

        // Send initial terminal size only if it has changed
        if (fitAddon.current) {
          const dims = fitAddon.current.proposeDimensions();
          if (dims) {
            const cols = Math.min(Math.max(dims.cols, 40), 120);
            const rows = Math.min(Math.max(dims.rows, 10), 40);
            if (cols !== initialCols || rows !== initialRows) {
              console.log('Sending resize event on ws.onopen:', cols, rows);
              ws.send(JSON.stringify({
                type: 'resize',
                cols,
                rows
              }));
            }
          }
        }

        // Start keepalive ping
        keepAliveInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 20000); // 20 seconds
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
          } catch {
            // If not JSON, treat as raw data
            terminalInstance.current.write(event.data);
          }
        }
      };

      ws.onerror = () => {
        console.error('WebSocket error');
        setError('WebSocket connection failed');
        setIsConnecting(false);
        if (terminalInstance.current) {
          terminalInstance.current.writeln('Connection failed. Please try again.');
        }
        if (keepAliveInterval) {
          clearInterval(keepAliveInterval);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        if (terminalInstance.current) {
          terminalInstance.current.writeln('\r\nConnection closed.');
        }
        if (keepAliveInterval) {
          clearInterval(keepAliveInterval);
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
      if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
      }
    }
  }, [nodeId, hostname, ipAddress, username]);

  React.useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize terminal
    const terminal = new Terminal({
      cursorBlink: true,
      fontSize: 16,
      fontFamily: "Monaco, Menlo, 'Ubuntu Mono', monospace",
      scrollback: 5000, // Increase scrollback buffer for large outputs
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
      rows: 80,
      cols: 24,
    });

    // Add addons
    const fit = new FitAddon();
    const webLinks = new WebLinksAddon();
    
    terminal.loadAddon(fit);
    terminal.loadAddon(webLinks);

    // Open terminal
    terminal.open(terminalRef.current);
    setTimeout(() => fit.fit(), 0); // Ensure DOM is ready before fitting

    // Store references
    terminalInstance.current = terminal;
    fitAddon.current = fit;

    // Handle window resize with debounce
    let resizeTimeout: NodeJS.Timeout | undefined;
    const handleResize = () => {
      if (fitAddon.current) {
        fitAddon.current.fit();
        // Send resize event to WebSocket if connected
        if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
          const dims = fitAddon.current.proposeDimensions();
          if (dims) {
            if (resizeTimeout) clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
              websocketRef.current && websocketRef.current.send(JSON.stringify({
                type: 'resize',
                cols: dims.cols,
                rows: dims.rows
              }));
            }, 100); // 100ms debounce
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
  }, [initializeConnection, cleanupConnection]);

  const handleClose = () => {
    cleanupConnection();
    onClose();
  };

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <h3 className="text-lg font-semibold mb-4">Connection Error</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <div className="flex justify-end space-x-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col z-50" style={{height: '100%', minHeight: 0}}>
      {/* Header */}
      <div className="db-terminal-header">
        <div className="window-controls">
          <div className="red"></div>
          <div className="yellow"></div>
          <div className="green"></div>
        </div>
        <div>
          {isConnecting ? 'Connecting...' : isConnected ? 'Connected' : 'Disconnected'} - {username}@{hostname}
        </div>
        <button
          onClick={handleClose}
          className="close-btn"
          aria-label="Close terminal"
        >
          ✕
        </button>
      </div>
      
      {/* Terminal */}
      <div className="flex-1" style={{height: '100%', minHeight: 0}}>
        <div ref={terminalRef} className="w-full h-full" style={{height: '100%', minHeight: 0}}></div>
      </div>
    </div>
  );
} 