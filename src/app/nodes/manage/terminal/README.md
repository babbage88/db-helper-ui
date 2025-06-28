# Terminal Component

This directory contains the xterm.js terminal components for SSH connections to managed nodes.

## Components

### TerminalComponent (`terminal.tsx`)
A full-featured terminal component that connects to real SSH sessions via WebSocket. This component:

- Establishes SSH connections through the backend API
- Uses WebSocket for real-time bidirectional communication
- Supports terminal resizing and proper SSH session handling
- Handles connection cleanup and error states

### TerminalFallbackComponent (`terminal-fallback.tsx`)
A simulated terminal component for development and testing purposes. This component:

- Provides a realistic terminal experience without requiring backend SSH support
- Simulates common Unix commands (ls, pwd, whoami, etc.)
- Useful for UI development and testing
- Clearly marked as "Simulated" in the interface

## Usage

The terminal components are integrated into the node management data table. Users can:

1. Navigate to the Nodes Management page
2. Click the "Connect" action in the dropdown menu for any node
3. A full-screen terminal will open with an SSH connection to that node

## Features

### Terminal Features
- **Full-screen terminal**: Takes over the entire viewport for optimal terminal experience
- **Responsive design**: Adapts to different screen sizes
- **Dark theme**: Professional terminal appearance with syntax highlighting
- **Keyboard shortcuts**: Standard terminal keyboard shortcuts work as expected
- **Copy/paste**: WebLinks addon enables clickable links and copy/paste functionality

### Connection Features
- **Connection status**: Real-time display of connection state
- **Error handling**: Graceful handling of connection failures
- **Retry mechanism**: Easy retry for failed connections
- **Clean disconnection**: Proper cleanup of resources on close

### Security Features
- **SSH key authentication**: Uses stored SSH keys for secure connections
- **User permissions**: Only allows connections to nodes the user has access to
- **Connection isolation**: Each terminal session is isolated from others

## Backend Integration

To enable real SSH connections, the backend needs to implement:

1. **SSH Connection API** (`/ssh/connect`):
   - Accepts `hostServerId` and `username`
   - Returns `connectionId` and `websocketUrl`
   - Establishes SSH connection using stored credentials

2. **WebSocket Endpoint**:
   - Handles bidirectional communication
   - Forwards terminal input/output between client and SSH session
   - Manages terminal resizing events

3. **Connection Management**:
   - Tracks active SSH connections
   - Handles connection cleanup
   - Manages user permissions

## Development

### Switching Between Components
To switch between real and simulated terminals, update the import in `data-table.tsx`:

```typescript
// For real SSH connections (requires backend)
import { TerminalComponent } from "@/components/db-helper/terminal";

// For development/testing (no backend required)
import { TerminalFallbackComponent } from "@/components/db-helper/terminal-fallback";
```

### Customization
The terminal appearance can be customized by modifying the theme object in the terminal configuration:

```typescript
theme: {
  background: '#1e1e1e',
  foreground: '#ffffff',
  cursor: '#ffffff',
  // ... other color definitions
}
```

### Adding Commands (Fallback Terminal)
To add new simulated commands to the fallback terminal, extend the `handleCommand` function in `terminal-fallback.tsx`.

## Dependencies

- `@xterm/xterm`: Core terminal emulator
- `@xterm/addon-fit`: Automatic terminal sizing
- `@xterm/addon-web-links`: Clickable links and copy/paste support

## Future Enhancements

- **Multiple terminals**: Support for multiple concurrent terminal sessions
- **Terminal tabs**: Tabbed interface for managing multiple connections
- **Session persistence**: Save and restore terminal sessions
- **File transfer**: Integrated SCP/SFTP functionality
- **Terminal recording**: Session recording and playback
- **Custom themes**: User-selectable terminal themes 