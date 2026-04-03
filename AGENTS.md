# db-helper-ui - Web Dashboard for Infrastructure Management

## Project Overview

**db-helper-ui** is a modern React-based web dashboard that provides developers and infrastructure teams with a graphical interface for managing:
- PostgreSQL database setup and configuration
- Host/node inventory management
- SSH key management
- User secrets and API tokens
- Interactive SSH terminal sessions
- SSL/TLS certificate generation and renewal

It serves as the visual counterpart to the `infra-cli` command-line tool, allowing users who prefer graphical interfaces to accomplish the same tasks with point-and-click simplicity.

### Core Philosophy

**"No need to search for 'Postgres 17 create new database and grant access to user' or ask AI."**

The dashboard automates repetitive infrastructure tasks with sensible defaults, clear visual workflows, and one-click operations.

---

## Technology Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 19.1.0 | UI component framework |
| **TypeScript** | 5.8.3 | Static type safety |
| **Vite** | 6.3.5 | Build tool and dev server |
| **React Router** | 7.5.3 | Client-side routing |
| **TailwindCSS** | 4.1.8 | Styling and theming |
| **Radix UI** | Latest | Accessible component primitives |
| **Axios** | 1.9.0 | HTTP client for API calls |
| **React Hook Form** | 7.58.0 | Form state management |
| **Zod** | 3.25.64 | Schema validation |
| **xterm.js** | 5.5.0 | Terminal emulation |
| **Sonner** | 2.0.3 | Toast notifications |
| **Lucide React** | 0.511.0 | Icon library |

---

## Project Structure

```
db-helper-ui/
├── src/
│   ├── app/                      # Page components
│   │   ├── LoginPage.tsx         # Authentication entry point
│   │   ├── keys/                 # SSH key management pages
│   │   │   └── manage/           # CRUD for SSH keys
│   │   ├── nodes/                # Host/node management pages
│   │   │   └── manage/           # CRUD for nodes
│   │   │       └── terminal/     # SSH terminal interaction
│   │   └── user_secrets/         # Secret management pages
│   │       └── manage/           # CRUD for secrets
│   │
│   ├── components/               # Reusable UI components
│   │   ├── app-sidebar.tsx       # Main navigation sidebar
│   │   ├── login-form.tsx        # Login form component
│   │   ├── nav-main.tsx          # Main navigation menu
│   │   ├── nav-projects.tsx      # Project navigation
│   │   ├── nav-user.tsx          # User profile/menu
│   │   ├── team-switcher.tsx     # Team/organization selector
│   │   ├── icons.tsx             # Custom icon definitions
│   │   │
│   │   ├── db-helper/            # Database helper components
│   │   │   ├── PostgresURLBuilder.tsx        # URL/connection string builder
│   │   │   ├── GeneratePgDevDbSetupScripts.tsx # Script generator
│   │   │   ├── add-ssh-key-dialog.tsx        # Add SSH key dialog
│   │   │   └── NavMenu.tsx                   # Navigation menu
│   │   │
│   │   ├── web-infra/            # Web infrastructure components
│   │   │   ├── CfCerts.tsx       # Certificate management
│   │   │   └── download.tsx      # Download utilities
│   │   │
│   │   ├── docs/                 # Documentation components
│   │   │   └── GettingStartedDoc.tsx
│   │   │
│   │   └── ui/                   # Base UI components (shadcn/ui inspired)
│   │       ├── button.tsx        # Button component
│   │       ├── card.tsx          # Card container
│   │       ├── dialog.tsx        # Modal dialog
│   │       ├── form.tsx          # Form wrapper
│   │       ├── input.tsx         # Text input
│   │       ├── select.tsx        # Dropdown select
│   │       ├── table.tsx         # Data table
│   │       ├── sidebar.tsx       # Sidebar container
│   │       ├── tabs.tsx          # Tab UI
│   │       ├── BobDashboard.tsx  # Main dashboard hub
│   │       ├── Login.tsx         # Login page UI
│   │       ├── LogoutButton.tsx  # Logout functionality
│   │       ├── LogoutRoute.tsx   # Logout route
│   │       ├── mode-toggle.tsx   # Dark/light theme toggle
│   │       ├── theme-provider.tsx # Theme context provider
│   │       └── ... (20+ other base components)
│   │
│   ├── lib/                      # Utilities and services
│   │   ├── api/                  # Auto-generated API client
│   │   │   ├── apiClient.ts      # API client configuration
│   │   │   ├── core/             # HTTP request/response handling
│   │   │   ├── models/           # TypeScript types/interfaces
│   │   │   └── services/         # API service classes
│   │   │
│   │   ├── auth-context.tsx      # Authentication state (React Context)
│   │   ├── tokenManager.ts       # JWT token management
│   │   ├── db-helper-svc.ts      # Database helper service
│   │   ├── web-infra-svc.ts      # Infrastructure service
│   │   ├── renewCertWithStoredSecret.ts # Certificate renewal
│   │   └── utils.ts              # General utility functions
│   │
│   ├── hooks/                    # Custom React hooks
│   │   └── use-mobile.ts         # Mobile device detection
│   │
│   ├── assets/                   # Static assets
│   │   └── DbBobMaskot.sky.svg   # DbBob mascot
│   │
│   ├── App.tsx                   # Root application component
│   ├── main.tsx                  # React DOM render entry point
│   ├── index.css                 # Global CSS
│   └── vite-env.d.ts            # Vite environment types
│
├── public/                       # Static files served as-is
├── vite.config.ts               # Vite configuration
├── tsconfig.json                # TypeScript configuration
├── eslint.config.js             # ESLint rules
├── Dockerfile                   # Container configuration
├── Makefile                     # Build commands
├── package.json                 # Dependencies and scripts
├── pnpm-workspace.yaml          # pnpm workspace config
├── nginx.conf                   # Nginx reverse proxy config
├── index.html                   # HTML entry point
└── README.md                    # Project readme
```

---

## Core Features and Components

### 1. Authentication System

**Location**: `src/app/LoginPage.tsx`, `src/lib/auth-context.tsx`, `src/lib/tokenManager.ts`

**Features**:
- Email/password login form
- JWT token-based authentication
- Persistent token storage (localStorage)
- Automatic token refresh
- Protected route enforcement
- Logout functionality

**Authentication Flow**:
```
User Input (Username/Password)
    ↓
POST /api/auth/login
    ↓
Receive JWT tokens (access + refresh)
    ↓
Store in localStorage
    ↓
Set Authorization header for API calls
    ↓
Protected routes become accessible
```

**Key Types**:
```typescript
AuthContextType {
    isAuthenticated: boolean | null
    setIsAuthenticated: (val: boolean) => void
}
```

---

### 2. PostgreSQL Configuration Tools

#### **2a. PostgreSQL URL/Connection String Builder**
*Location*: `src/components/db-helper/PostgresURLBuilder.tsx`

**Purpose**: Generate and validate PostgreSQL connection strings

**Inputs**:
- Database host
- Database port
- Username
- Password
- Database name
- SSL mode (disable, allow, prefer, require, verify-ca, verify-full)
- Additional connection options

**Outputs**:
- Connection string in multiple formats:
  - `postgresql://user:password@host:port/database`
  - `psql` command-line format
  - Go `pq` driver format
  - Python `psycopg2` format
  - Node.js `pg` driver format
  - Copy-to-clipboard buttons

**Use Cases**:
- Developers need quick connection strings
- DBA verification of connection parameters
- Multi-format copy for different applications

---

#### **2b. PostgreSQL Development Database Setup Generator**
*Location*: `src/components/db-helper/GeneratePgDevDbSetupScripts.tsx`

**Purpose**: Generate three coordinated SQL/shell scripts for complete database setup

**Inputs**:
- Database hostname
- Database port
- Superuser username
- Superuser password
- Application database name
- Application user username
- Application user password
- App schema name (defaults to `public`)

**Generated Outputs**:

1. **Shell Script** (`setup.sh`)
   - Orchestrates execution of SQL scripts
   - Handles error checking
   - Proper credential passing

2. **Database Creation SQL** (`pg_create_db.sql`)
   - Creates application database
   - Creates service account role/user
   - Sets password for service account
   - Grants database privileges

3. **Schema Setup SQL** (`pg_app_db.sql`)
   - Grants schema permissions
   - Sets schema ownership
   - Configures default privileges

**Workflow**:
```
1. User fills database configuration form
2. Click "Generate Scripts"
3. System generates three scripts
4. User downloads ZIP file
5. Extract scripts on PostgreSQL server
6. Run ./setup.sh
7. Database and user ready for application
```

**Key Functions**:
```typescript
generateDbUserScriptsHandler() // API endpoint handler
downloadZip() // Download generated scripts
fetchStringFromFile() // Load script templates
```

---

### 3. Infrastructure Node Management

**Location**: `src/app/nodes/manage/`

**Pages**:
- List view with data table
- Add node dialog
- Edit node details
- Delete with confirmation
- Terminal session integration

**Capabilities**:
- Register host servers (VMs, physical servers, cloud instances)
- Specify hostname, IP address, SSH user
- Associate SSH keys per node
- Track platform types (Docker, PostgreSQL, etc.)
- Real-time connectivity checks
- Interactive SSH terminal access

**Data Table Columns**:
- Hostname
- IP Address
- SSH User
- Status (online/offline)
- Associated SSH Key
- Actions (connect, edit, delete)

---

### 4. SSH Key Management

**Location**: `src/app/keys/manage/`

**Features**:
- List all registered SSH keys
- Add new SSH key (upload public key)
- View key fingerprint
- Delete key
- Assign key to nodes
- Key format detection

**Add SSH Key Dialog**:
`src/components/db-helper/add-ssh-key-dialog.tsx`

**Workflow**:
```
1. Click "Add SSH Key"
2. Enter key name
3. Paste public key content
4. System calculates fingerprint
5. Store in database
6. Available for node assignments
```

---

### 5. User Secrets Management

**Location**: `src/app/user_secrets/manage/`

**Purpose**: Securely store and manage API tokens, passwords, and secrets

**Secret Types**:
- SSH private keys
- API tokens (Proxmox, Cloudflare, AWS, etc.)
- Database passwords
- OAuth tokens
- Custom application secrets

**Features**:
- Create new secret
- Edit secret value
- Delete secret
- Audit trail (accessed_at timestamp)
- Type-based organization
- Search and filter

**Security Notes**:
- Secrets encrypted in backend database
- Never exposed in API responses (except during creation)
- User-scoped (only creator can access)
- HTTPS only
- CSP headers prevent accidental logging

---

### 6. Interactive SSH Terminal

**Location**: `src/app/nodes/manage/terminal/`

**Technology**: xterm.js (browser-based terminal emulation)

**Features**:
- Real-time SSH terminal session
- Color support
- Mouse input handling
- Copy/paste support
- Session logging
- Auto-reconnect on disconnect
- Resize handling

**WebSocket Connection**:
```
ws://server/api/v1/ws/ssh/{hostID}
```

**Workflow**:
```
1. Select node from inventory
2. Click "Connect"
3. WebSocket establishes SSH session
4. Terminal initialized with PTY
5. User can interact as if using `ssh` command
6. Logs recorded on backend
7. Session closes on disconnect
```

---

### 7. Certificate Management

**Location**: `src/components/web-infra/CfCerts.tsx`

**Purpose**: Generate and renew Let's Encrypt SSL/TLS certificates via Cloudflare

**Features**:
- Input domain names
- Select certificate type (single, wildcard, multiple domains)
- Request certificate generation
- Monitor renewal status
- Download certificates
- Automatic renewal scheduling

**Use Cases**:
- Website HTTPS setup
- API endpoint security
- Internal service certificates

---

### 8. Theme and Branding

**Location**: `src/components/ui/theme-provider.tsx`, `src/components/ui/mode-toggle.tsx`

**Features**:
- Light/dark theme toggle
- System preference detection
- Cookie-based persistence
- Smooth transitions
- TailwindCSS dark mode support

**Theme Variables**:
```css
--background
--foreground
--card
--card-foreground
--primary
--primary-foreground
--secondary
--destructive
```

---

## Page Routing Structure

```
/                          (redirects based on auth)
├─ /login                  LoginPage - Authentication entry
├─ /dashboard             Dashboard - Main hub with feature cards
│  ├─ /pgurlbuilder       PostgreSQL URL Builder
│  ├─ /scripts            Dev DB Setup Script Generator
│  └─ /cert-renew         Certificate Management
├─ /manage/nodes          Node/Host Management
│  ├─ /manage/nodes/:id   Node details
│  └─ /terminal/:nodeId   SSH Terminal (WebSocket)
├─ /manage/keys           SSH Key Management
│  └─ /manage/keys/:id    Key details
├─ /manage/secrets        User Secrets Management
│  └─ /manage/secrets/:id Secret details
└─ /logout                LogoutRoute - Clean session
```

---

## API Integration

### API Client Architecture

**Location**: `src/lib/api/`

**Auto-Generated From**: OpenAPI specification (`../go-infra/swagger.json`)

**Generation Command**:
```bash
npm run gen-api
# Uses openapi-typescript-codegen
# Generates type-safe API client classes
```

**Key Service Classes**:
- `AuthenticationService` - Login, logout, token refresh
- `HostService` - Host/node CRUD
- `SSHKeyService` - SSH key management
- `SecretsService` - Secret storage
- `DeploymentsService` - Application deployments

**API Client Configuration**:
```typescript
// src/lib/api/apiClient.ts
OpenAPI.TOKEN = localStorage.getItem("accessToken")
OpenAPI.BASE = import.meta.env.VITE_API_BASE_URL
OpenAPI.HEADERS = {
    "Authorization": "Bearer <token>"
}
```

### HTTP Interceptors

- **Request**: Inject JWT token in Authorization header
- **Response**: Handle 401 (unauthorized) → redirect to login
- **Error**: Extract backend error messages and display to user
- **Timeout**: Handle network timeout with user notification

---

## State Management

### Authentication State (React Context)

```typescript
// src/lib/auth-context.tsx
export type AuthContextType = {
  isAuthenticated: boolean | null
  setIsAuthenticated: (val: boolean) => void
}

// Usage in components
const { isAuthenticated } = useAuth()
```

### Form State (React Hook Form + Zod)

Example usage:
```typescript
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

const schema = z.object({
  hostname: z.string().min(1, "Required"),
  ipAddress: z.string().ip("Invalid IP"),
})

const { register, handleSubmit } = useForm({
  resolver: zodResolver(schema),
})
```

### Token Management

**Location**: `src/lib/tokenManager.ts`

**Functions**:
- `setAccessToken(token)` - Store access token
- `getAccessToken()` - Retrieve access token
- `setRefreshToken(token)` - Store refresh token
- `setUserInfo(id, username, email)` - Store user details
- `clearAllTokens()` - Logout cleanup

---

## Environment Configuration

### Environment Variables

```bash
VITE_API_BASE_URL=https://api.example.com/api/v1
VITE_DBHELPER_API_BASE_URL=https://api.example.com
VITE_APP_NAME=DbBob
VITE_MODE=production|development|test
```

### Development vs Production

**Development** (`npm run dev`):
- Hot module reloading
- Source maps
- HTTPS with self-signed cert
- Verbose logging

**Production** (`npm run build`):
- Minification
- Tree-shaking
- Asset optimization
- Source map removal

---

## Build and Deployment

### Build Commands

```bash
# Install dependencies
pnpm install

# Development server with hot reload
npm run dev

# Production build
npm run build

# Preview production build locally
npm run preview

# Generate API client from OpenAPI spec
npm run gen-api

# Run linting
npm run lint
```

### Docker Deployment

**Dockerfile** uses:
- Node.js base image
- pnpm for dependency management
- Nginx for serving built assets
- Multi-stage build for optimization

**Build**:
```bash
docker build -t db-helper-ui:latest .
docker run -p 3000:80 db-helper-ui:latest
```

**Kubernetes Integration**:
- `kube-svc-ui.yaml` - Service definition
- `uiIngress.yaml` - Ingress routing
- `clusterIPsvc.yaml` - Internal service

### Nginx Configuration

**Purpose**: Reverse proxy, compression, caching

Key directives:
- Gzip compression for assets
- Cache headers for static files
- API request proxying to backend
- SSL/TLS termination (optional)

---

## Component Architecture

### Base UI Components (shadcn/ui style)

Located in `src/components/ui/`, these are building blocks:

**Form Components**:
- Button
- Input
- Select
- Checkbox
- Dialog
- Form wrapper

**Layout Components**:
- Card
- Sidebar
- Tabs
- Separator
- Scroll Area

**Feedback Components**:
- Sonner (toast notifications)
- Alert dialogs
- Loading spinners

**Example**:
```typescript
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

export function MyComponent() {
  return (
    <Card>
      <CardContent>
        <Input placeholder="Enter value" />
        <Button>Submit</Button>
      </CardContent>
    </Card>
  )
}
```

### Feature Components

**Database Helper Components**:
- PostgresURLBuilder - Standalone or embedded
- GeneratePgDevDbSetupScripts - Multi-step form
- AddSSHKeyDialog - Modal dialog

**Web Infrastructure Components**:
- CfCerts - Certificate management
- Download utilities

**Navigation Components**:
- AppSidebar - Main navigation drawer
- NavMain - Menu items
- NavUser - User profile menu
- TeamSwitcher - Organization selector

---

## Styling Approach

### TailwindCSS

**Utility-first CSS framework**:
```tsx
<div className="flex flex-col gap-4 p-6 md:p-10 dark:bg-slate-900">
  <h1 className="text-3xl font-bold text-center">Title</h1>
</div>
```

### Dark Mode Support

```tsx
export function MyComponent() {
  return (
    <div className="bg-white dark:bg-slate-900">
      <p className="text-black dark:text-white">Content</p>
    </div>
  )
}
```

### Custom CSS Variables

**Color scheme**:
```css
:root {
  --background: 0 0% 100%;
  --foreground: 0 0% 3.6%;
  --primary: 0 0% 9%;
  --secondary: 0 0% 14.9%;
  --destructive: 0 84.2% 60.2%;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: 0 0% 3.6%;
    --foreground: 0 0% 98%;
  }
}
```

---

## Type Safety with TypeScript

### Generated API Types

Auto-generated from OpenAPI spec:
```typescript
// src/lib/api/models/
export interface HostServer {
  id: string // UUID
  hostname: string
  ip_address: string
  username?: string
  ssh_key_id?: string
  created_at: string // ISO timestamp
  last_modified: string
}

export interface AuthToken {
  accessToken: string
  refreshToken: string
  expiresIn: number
  user_id: string
  userName: string
  email: string
}
```

### Custom Types

```typescript
// src/app/LoginPage.tsx
async function handleLoginSubmit(
  event: FormEvent<HTMLFormElement>
): Promise<void> {
  // Type-safe form handling
}
```

---

## User Workflows

### Workflow 1: Set Up PostgreSQL Database for Development

```
1. Navigate to /scripts
2. Fill in database configuration:
   - Host: localhost
   - Port: 5432
   - Superuser: postgres
   - Password: xxxxx
   - App DB name: myapp_dev
   - App user: myapp_user
   - App password: xxxxx
3. Click "Generate Scripts"
4. Download pg_setup_scripts.zip
5. Extract on PostgreSQL server:
   unzip pg_setup_scripts.zip
6. Execute setup script:
   ./setup.sh
7. Database ready for application
```

### Workflow 2: Add Host Server to Registry

```
1. Navigate to /manage/nodes
2. Click "Add Node"
3. Enter:
   - Hostname: db-server-01
   - IP: 192.168.1.100
   - SSH User: admin
4. Click "Save"
5. System verifies SSH connectivity
6. Node appears in inventory
7. Can now run deployments
```

### Workflow 3: Open SSH Terminal to Host

```
1. Navigate to /manage/nodes
2. Click on node row
3. Click "Terminal" button
4. WebSocket session established
5. Interactive terminal loads
6. Type commands as if using SSH
7. Colors and special keys supported
8. Session logs recorded
```

### Workflow 4: Store and Manage Secrets

```
1. Navigate to /manage/secrets
2. Click "Add Secret"
3. Enter:
   - Name: proxmox-api-token
   - Type: API Token
   - Value: xxx-yyyy-zzz
4. Click "Create"
5. Secret encrypted and stored
6. Available for deployments
7. Click "Audit" to see access history
```

---

## Security Considerations

### Client-Side Security

1. **Content Security Policy (CSP)**
   - Blocks inline scripts
   - Restricts script sources
   - Prevents accidental secret logging

2. **HTTPS Only**
   - All API calls over TLS
   - Self-signed certs for development
   - Production certs via Let's Encrypt

3. **Token Handling**
   - Stored in localStorage (accessible to JavaScript)
   - Never stored in cookies (HTTPONLY not used, trade-off for SPA)
   - Tokens sent in Authorization header
   - Tokens removed on logout

4. **Input Validation**
   - Zod schema validation
   - HTML form validation
   - API response validation

### Backend Coordination

- API validates all authentication
- Secrets encrypted in database
- Rate limiting on authentication endpoint
- CORS configured for allowed origins
- User can only access their own resources

---

## Testing Strategy

### Current Testing

```bash
npm run lint
# Runs ESLint on all TypeScript/TSX files
```

### Recommended Testing Additions

1. **Unit Tests** (Jest)
   - API client tests
   - Form validation tests
   - Utility function tests

2. **Component Tests** (React Testing Library)
   - LoginForm component
   - NodeTable component
   - Terminal component

3. **Integration Tests** (Cypress/Playwright)
   - Full login workflow
   - Node CRUD workflow
   - Database script generation
   - SSH terminal interaction

---

## Performance Optimization

### Bundle Size

**Current Optimizations**:
- Tree-shaking via Vite
- Dynamic imports for routes (planned)
- Gzip compression via Nginx
- Asset hashing for caching

**Opportunities**:
- Code splitting by route
- Image optimization
- CSS minification
- Lazy load components

### Runtime Performance

- React 19 automatic batching
- Memo for expensive components
- useCallback for event handlers
- Virtualization for long lists

### Network Performance

- API response caching
- Request deduplication
- WebSocket for real-time updates (terminal)
- Compression of JSON responses

---

## Common Development Tasks

### Add a New Page

1. Create file `src/app/newpage/page.tsx`
2. Import in `src/App.tsx`
3. Add route to Router
4. Add nav link to sidebar

### Add a New Component

1. Create file `src/components/feature/MyComponent.tsx`
2. Export component
3. Import and use in pages

### Call API Endpoint

```typescript
import { HostService } from "@/lib/api"

const hosts = await HostService.getHosts()
```

### Add Environment Variable

1. Add to `.env` file
2. Reference as `import.meta.env.VITE_VARNAME`
3. Vite exposes with `VITE_` prefix only

### Update API Client

```bash
npm run gen-api
# Regenerates from go-infra/swagger.json
# Then run: git restore src/lib/api/core/request.ts
```

---

## Troubleshooting

### Common Issues

**Issue**: White screen, no errors  
**Solution**: Check browser console, verify API_BASE_URL env var

**Issue**: API calls failing with 401  
**Solution**: Token expired, clear localStorage, login again

**Issue**: Terminal not connecting  
**Solution**: Check WebSocket URL, verify host connectivity, check firewall

**Issue**: Styles not loading  
**Solution**: Clear Vite cache, restart dev server

---

## Future Roadmap

### Planned Features

1. **Application Deployment UI**
   - Register applications
   - Configure deployment options
   - Deploy to selected hosts
   - Monitor deployment progress

2. **Systemd Service Management**
   - Create custom systemd services
   - Configure timers for recurring jobs
   - Monitor service status
   - View service logs

3. **Advanced Database Management**
   - PostgreSQL user management
   - Database backup/restore UI
   - Query builder
   - Database migration UI

4. **Infrastructure Visualization**
   - Network topology diagram
   - Infrastructure dependency graph
   - Resource utilization charts
   - Deployment pipeline visualization

5. **Multi-Tenancy**
   - Organization/team management
   - Role-based access control UI
   - Team SSH key sharing

6. **Advanced Authentication**
   - OAuth2 provider integration
   - LDAP/Active Directory
   - Multi-factor authentication (MFA)
   - SSO (Single Sign-On)

7. **Monitoring and Logs**
   - Real-time deployment logs
   - Service metrics dashboard
   - Log aggregation
   - Alerts and notifications

---

## Development Environment Setup

### Prerequisites

- Node.js 18+
- pnpm 8+ (or npm)
- Git

### Quick Start

```bash
# Clone repository
git clone <repo-url>
cd db-helper-ui

# Install dependencies
pnpm install

# Create .env file
cp .env.example .env
# Edit .env with your API URL

# Start development server
pnpm dev

# Server running at https://localhost:5173
```

### IDE Setup (VS Code)

**Recommended Extensions**:
- ES7+ React/Redux/React-Native snippets
- TypeScript Vue Plugin
- Tailwind CSS IntelliSense
- ESLint
- Prettier

**VS Code Settings** (`.vscode/settings.json`):
```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

---

## Build Pipeline

### GitHub Actions / CI/CD

**Recommended workflow**:
```yaml
name: Build and Test
on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
      - run: pnpm install
      - run: pnpm lint
      - run: pnpm build
      - run: docker build -t db-helper-ui:latest .
```

---

## File Organization Best Practices

### Component Naming
- Page components in `src/app/feature/page.tsx`
- Reusable components in `src/components/feature/Component.tsx`
- Base UI in `src/components/ui/Button.tsx` (no prefix)

### Imports
- Use path aliases: `@/components/ui/button` (configured in tsconfig.json)
- Keep import order: React → Libraries → Components → Utils

### CSS/Styling
- Use Tailwind utility classes where possible
- Create CSS modules for complex styles: `Component.module.css`
- Theme variables for colors

---

## Contributing Guidelines

### Code Style

- Run `npm run lint` before committing
- Use TypeScript strict mode
- Add JSDoc comments for complex functions
- Keep components small and focused

### Pull Request Process

1. Create feature branch: `git checkout -b feature/description`
2. Make changes with clear commit messages
3. Run linter and tests: `npm run lint`
4. Build: `npm run build`
5. Create pull request with description
6. Request code review

### Documentation

- Update README for new features
- Add comments for non-obvious code
- Update this AGENTS.md if adding new sections

---

## Deployment Checklist

- [ ] Environment variables configured
- [ ] API URL correct for environment
- [ ] Auth tokens configured
- [ ] HTTPS certificates valid
- [ ] CORS origins configured on backend
- [ ] Database migrations run
- [ ] Build succeeds: `npm run build`
- [ ] No console errors in production
- [ ] API connectivity verified
- [ ] WebSocket connectivity verified (terminal)

---

## Support and Documentation

### Internal Documentation
- [INFRACTL_ARCHITECTURE.md](../INFRACTL_ARCHITECTURE.md) - Overall system design
- [infra-cli AGENTS.md](../infra-cli/AGENTS.md) - CLI tool documentation
- [go-infra AGENTS.md](../go-infra/AGENTS.md) - Backend API documentation

### External Resources
- [React Documentation](https://react.dev)
- [TailwindCSS Docs](https://tailwindcss.com)
- [React Router Docs](https://reactrouter.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Vite Guide](https://vite.dev/guide)

---

## Performance Metrics to Monitor

- **First Contentful Paint (FCP)**: < 2 seconds
- **Largest Contentful Paint (LCP)**: < 2.5 seconds
- **Cumulative Layout Shift (CLS)**: < 0.1
- **Time to Interactive (TTI)**: < 3.5 seconds
- **Bundle Size**: < 500KB (gzipped)

---

## License

See LICENSE file in repository root.

---

**Version**: 0.0.3  
**Last Updated**: April 2026  
**Framework**: React 19 + TypeScript  
**Status**: Active Development
