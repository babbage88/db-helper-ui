# User Management Component

A comprehensive React component for managing user accounts with full CRUD operations built with shadcn/ui components.

## Features

- **View Users**: Display all users in a sortable, filterable data table
- **Create Users**: Add new user accounts with validation
- **Reset Passwords**: Update user passwords securely
- **Enable/Disable Users**: Toggle user account status
- **Delete Users**: Soft delete user accounts with confirmation
- **Bulk Operations**: Delete multiple users at once
- **Search & Filter**: Search users across all fields
- **Pagination**: Navigate through large user lists

## Components

### `UserManagement` (index.tsx)
Main container component that orchestrates the user management UI. Handles:
- Loading user data from the API
- Managing dialog states
- Coordinating between child components

### `UserDataTable` (user-data-table.tsx)
Data table component that displays users with:
- Column-based layout with sorting
- Global filtering/search
- Row selection for bulk operations
- Inline action menus
- Confirmation dialogs for destructive actions
- Pagination controls

### `CreateUserDialog` (create-user-dialog.tsx)
Dialog form for creating new users with:
- Username, email, name validation
- Password strength validation
- Password confirmation matching
- Form error handling

### `ResetPasswordDialog` (reset-password-dialog.tsx)
Dialog form for updating user passwords with:
- Password strength validation
- Password confirmation matching
- User feedback on success/failure

### `user-columns.tsx`
Column definitions for the data table, including:
- Selection checkbox column
- User fields (username, email, name, status)
- Status badge display
- Action dropdown menu

## Usage

Import and use the `UserManagement` component in your app:

```tsx
import { UserManagement } from "@/components/db-helper/users";

export default function UsersPage() {
  return (
    <div className="p-8">
      <UserManagement />
    </div>
  );
}
```

## API Integration

The component integrates with the `UserCrudService` which provides:
- `getAllUsers()` - Fetch all users
- `createUser(request)` - Create new user
- `updateUserPw(request)` - Update user password
- `softDeleteUserById(request)` - Delete user
- `disableUser(request)` - Disable user account
- `enableUser(request)` - Enable user account

## Styling

All components use:
- **shadcn/ui** components for consistent design
- **Tailwind CSS** for styling
- **Lucide React** for icons

## Requirements

- React 19+
- TanStack React Table v8+
- react-hook-form
- zod (for validation)
- shadcn/ui components

## Future Enhancements

- Edit user profile information (first name, last name, email)
- Role/permission management
- User activity logs
- Batch password reset
- Export users to CSV
- Advanced filtering by status, creation date, etc.
