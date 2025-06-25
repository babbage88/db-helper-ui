"use client";

import * as React from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import "@xterm/xterm/css/xterm.css";

interface TerminalProps {
  nodeId: string;
  hostname: string;
  ipAddress: string;
  username: string;
  onClose: () => void;
}

export function TerminalFallbackComponent({ nodeId, hostname, ipAddress, username, onClose }: TerminalProps) {
  const terminalRef = React.useRef<HTMLDivElement>(null);
  const terminalInstance = React.useRef<Terminal | null>(null);
  const fitAddon = React.useRef<FitAddon | null>(null);
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
      }
    };

    window.addEventListener('resize', handleResize);

    // Initialize connection
    initializeConnection();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (terminalInstance.current) {
        terminalInstance.current.dispose();
      }
    };
  }, [nodeId, hostname, ipAddress, username]);

  const initializeConnection = async () => {
    if (!terminalInstance.current) return;

    setIsConnecting(true);
    setError(null);

    try {
      // Display connection message
      terminalInstance.current.writeln(`Connecting to ${username}@${ipAddress} (${hostname})...`);
      terminalInstance.current.writeln('');

      // Simulate connection process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate a terminal session
      terminalInstance.current.writeln(`Connected to ${hostname} (${ipAddress})`);
      terminalInstance.current.writeln(`Welcome ${username}!`);
      terminalInstance.current.writeln('');
      terminalInstance.current.writeln('This is a simulated terminal session for development.');
      terminalInstance.current.writeln('Type "help" for available commands or "exit" to disconnect.');
      terminalInstance.current.writeln('');

      // Set up input handling
      let currentLine = '';
      terminalInstance.current.onData((data) => {
        if (data === '\r') {
          // Enter key pressed
          terminalInstance.current?.writeln('');
          handleCommand(currentLine);
          currentLine = '';
          terminalInstance.current?.write('$ ');
        } else if (data === '\u007f') {
          // Backspace
          if (currentLine.length > 0) {
            currentLine = currentLine.slice(0, -1);
            terminalInstance.current?.write('\b \b');
          }
        } else if (data >= ' ') {
          // Printable character
          currentLine += data;
          terminalInstance.current?.write(data);
        }
      });

      // Write initial prompt
      terminalInstance.current.write('$ ');
      setIsConnected(true);
      setIsConnecting(false);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
      setIsConnecting(false);
      terminalInstance.current?.writeln('Connection failed. Please try again.');
    }
  };

  const handleCommand = (command: string) => {
    if (!terminalInstance.current) return;

    const trimmedCommand = command.trim();
    
    if (trimmedCommand === 'exit' || trimmedCommand === 'logout') {
      terminalInstance.current.writeln('Disconnecting...');
      setTimeout(() => {
        onClose();
      }, 1000);
      return;
    }

    if (trimmedCommand === 'help') {
      terminalInstance.current.writeln('Available commands:');
      terminalInstance.current.writeln('  help     - Show this help message');
      terminalInstance.current.writeln('  exit     - Disconnect from terminal');
      terminalInstance.current.writeln('  logout   - Disconnect from terminal');
      terminalInstance.current.writeln('  clear    - Clear the terminal');
      terminalInstance.current.writeln('  pwd      - Show current directory');
      terminalInstance.current.writeln('  ls       - List files');
      terminalInstance.current.writeln('  whoami   - Show current user');
      terminalInstance.current.writeln('  date     - Show current date/time');
      terminalInstance.current.writeln('  uname    - Show system information');
      terminalInstance.current.writeln('');
      return;
    }

    if (trimmedCommand === 'clear') {
      terminalInstance.current.clear();
      return;
    }

    if (trimmedCommand === 'pwd') {
      terminalInstance.current.writeln('/home/' + username);
      return;
    }

    if (trimmedCommand === 'ls') {
      terminalInstance.current.writeln('Documents  Downloads  Pictures  Videos');
      terminalInstance.current.writeln('Desktop    Music      Public    Templates');
      return;
    }

    if (trimmedCommand === 'whoami') {
      terminalInstance.current.writeln(username);
      return;
    }

    if (trimmedCommand === 'date') {
      terminalInstance.current.writeln(new Date().toString());
      return;
    }

    if (trimmedCommand === 'uname') {
      terminalInstance.current.writeln('Linux ' + hostname + ' 5.15.0-generic #1 SMP x86_64 GNU/Linux');
      return;
    }

    if (trimmedCommand === '') {
      return;
    }

    // For any other command, simulate "command not found"
    terminalInstance.current.writeln(`bash: ${trimmedCommand}: command not found`);
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
            {username}@{hostname} ({ipAddress}) - [Simulated]
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
          onClick={onClose}
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