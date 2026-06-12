# Lynx

Lynx is a comprehensive frontend template built with Nuxt 4. It provides a solid foundation with authentication, user
management, role-based access control, internationalization, and a modern UI.

## Features

### Authentication & Authorization

- **JWT-based Authentication**: Secure login, registration, and password reset functionality.
- **Role-Based Access Control (RBAC)**: Hierarchical roles with granular permissions for fine-tuned access control.
- **Middleware Guards**: Authenticated and guest route protection.

### User Management

- **CRUD Operations**: Create, read, update, and delete users.
- **Profile Editing**: Users can edit their own profiles.
- **Role Assignment**: Assign roles to users with associated permissions.

### Role Management

- **Role Hierarchy**: Define role hierarchies for organizational structure.
- **Permission System**: Assign specific permissions to roles (e.g., users-create, roles-read, api-keys-update).
- **Dynamic Permissions**: Support for API key management permissions.

### User Interface

- **Modern UI**: Built with Nuxt UI and TailwindCSS for a responsive and accessible interface.
- **Dark/Light Theme**: Toggle between dark and light modes.
- **Internationalization (i18n)**: Support for English and Spanish languages with easy locale switching.
- **Lazy-Loaded Datatables**: Efficient data tables with pagination, filtering, and sorting.

### Technical Features

- **Nuxt 4**: Latest Nuxt framework with server-side rendering and static generation.
- **TypeScript**: Full type safety throughout the application.
- **Pinia State Management**: Centralized state management for complex applications.
- **Composable Architecture**: Reusable composables for authentication, access control, and data fetching.
- **API Integration**: Repository pattern for clean API interactions.
- **Form Validation**: Zod schema validation for robust form handling.
- **Error Handling**: Comprehensive error handling with custom exceptions.
- **Query Builder**: URL-based query management for filters and pagination.

## Architecture

### Repository → Composable → Components Pattern

Lynx follows a clean architecture pattern where data access, business logic, and UI are separated into distinct layers:

- **Repositories**: Handle API calls and data fetching. They extend a base `Repository` class that provides a unified `$api` interface.
- **Composables**: Encapsulate business logic and state management. They use repositories to fetch data and provide reactive functions to components.
- **Components**: Focus on UI rendering and user interactions. They consume composables for data and logic.

This pattern promotes reusability, testability, and separation of concerns.

### Permissions and Permissions Handling

Permissions are defined as constants in `app/constants/permissions.ts` and include actions like `users-create`, `roles-read`, etc.

The `useAccessControl` composable provides reactive permission checking:

- `userCan(permission)`: Check if user has a specific permission
- `roleCan(hierarchy, selfIncluded)`: Check role hierarchy access
- `userIsAllowed`: Computed property for overall access based on a list of permissions

Permissions are stored in the auth store and checked against the user's role.

### Lazy Loading Component and Features

The `SharedLazyLoadedDatatable` component provides efficient data loading with:

- **Pagination**: Server-side pagination with page navigation
- **Filtering**: Global search and column-specific filters
- **Sorting**: URL-based sorting parameters
- **Expandable Rows**: Optional row expansion for detailed views
- **Query Builder**: Automatic URL query string management for filters and pagination

It uses `useAsyncData` for reactive data fetching and integrates with Laravel-style pagination.

### Authentication Flow

The authentication flow includes:

1. **Login**: User enters credentials, JWT token is obtained and stored
2. **Registration**: New users can sign up
3. **Password Reset**: Forgot password functionality
4. **Session Management**: Automatic token refresh and cross-tab synchronization
5. **Logout**: Clear session and redirect to log in

Routes are protected by middleware guards (`auth-guard`, `guest-guard`).

### Theming System

Lynx uses **Nuxt UI v4** with a fully customizable theme system. The theme is configured through three main files:

1. **Design Tokens** (`app/assets/css/main.css`): Define CSS variables for colors, spacing, radius, and dark mode
2. **Semantic Colors** (`app/app.config.ts`): Map semantic color names to your color palette and customize components
3. **Build Configuration** (`nuxt.config.ts`): Register custom colors and enable global theme options

For detailed theming documentation, including:

- How to create custom color palettes
- Component customization strategies
- Dark mode configuration
- Usage examples and best practices
- Migration guide for new projects

**See the complete guide**: [docs/THEME.md](docs/THEME.md)

## Getting Started

### Prerequisites

- Node.js (version 20 or higher)
- npm or yarn

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/Nuwebs/lynx.git
   cd lynx
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:
   Copy `.env.example` to `.env` and configure your API endpoints and environment settings.

4. Run the development server:

   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:3000`.

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## License

This project is private and proprietary. All rights reserved.
