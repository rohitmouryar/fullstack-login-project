# Admin-Controlled Full-Stack Login Project

A complete role-based authentication starter where **only the administrator can create user accounts**. Public registration is disabled.

## Included features

- React + Vite frontend
- Node.js + Express backend
- JWT authentication and protected APIs
- Password hashing with bcryptjs
- Admin and user roles
- Separate admin panel and user dashboard
- Admin can create users
- Admin can enable or disable user login access
- Admin can permanently delete user accounts
- Searchable user directory
- Persistent MySQL storage
- Responsive desktop and mobile UI

## Required software

- Node.js 18.18 or newer
- npm 9 or newer

## Start the project

```bash
npm install
```

Create the backend environment file and update the MySQL credentials.

### Windows PowerShell

```powershell
Copy-Item backend/.env.example backend/.env
```

### macOS/Linux

```bash
cp backend/.env.example backend/.env
```

Start frontend and backend together:

```bash
npm run dev
```

Before starting the app, run `backend/database/schema.sql` in MySQL Workbench
as an administrator. It creates the `novaauth` database, local application user,
and `users` table. The password in that SQL file must match `DB_PASSWORD` in
`backend/.env`.

Start the backend and frontend in separate terminals:

```powershell
cd backend
npm run dev
```

```powershell
cd frontend
npm run dev
```

Open: `http://localhost:5173`

Backend health check: `http://localhost:4001/api/health`

## Default administrator

- Email: `admin@example.com`
- Password: `Admin@123`

Change these values in `backend/.env` before the first startup:

```env
ADMIN_NAME=System Administrator
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=Admin@123
```

The admin account is seeded only when that email does not already exist.

## Application flow

```text
Admin signs in
  -> Admin panel opens
  -> Admin creates a user account
  -> User receives email and temporary password
  -> User signs in
  -> Protected user dashboard opens
```

A visitor cannot create an account because there is no public registration page or public registration API.

## Environment variables

Edit `backend/.env`:

```env
PORT=4001
CLIENT_URL=http://localhost:5173
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=2h
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=novaauth
DB_USER=novaauth_user
DB_PASSWORD=ChangeThisStrongPassword123!
ADMIN_NAME=System Administrator
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=Admin@123
```

## Important production note

Use a unique database password and JWT secret in production. Also use secure
HTTP-only cookies, login rate limiting, password reset, audit logs, TLS, database
backups, and forced temporary-password changes.
