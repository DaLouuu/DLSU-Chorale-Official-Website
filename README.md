# DLSU Chorale Attendance System

Official attendance management system for DLSU Chorale members.

## Overview

A modern web application for managing member attendance, excuse requests, and administrative tasks for the DLSU Chorale organization.

---

## Running the Website Locally with Docker

### Prerequisites

- [Docker](https://www.docker.com/get-started) installed on your machine
- [Docker Compose](https://docs.docker.com/compose/install/) (usually included with Docker Desktop)

### Quick Start

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone <repository-url>
   cd DLSU-CHO-Official-Website
   ```

2. **Create environment file** (optional, but recommended):
   ```bash
   cp env.example .env
   ```
   
   The `.env` file is already configured with default values, but you can customize them if needed.

3. **Start the development server**:
   ```bash
   docker compose up
   ```
   
   Or run in detached mode (background):
   ```bash
   docker compose up -d
   ```

4. **Open your browser**:
   - Main page: [http://localhost:3000](http://localhost:3000)
   - Register page: [http://localhost:3000/register](http://localhost:3000/register)
   - Attendance form: [http://localhost:3000/attendance-form](http://localhost:3000/attendance-form)

### Hot Reload

The Docker setup supports **hot reload** - any changes you make to the source code will automatically refresh in the browser. No need to restart the container!

### Stopping the Containers

To stop the development server:
```bash
docker compose down
```

To stop and remove volumes (clean slate):
```bash
docker compose down -v
```

### Rebuilding the Container

If you make changes to `Dockerfile.dev` or `package.json`, rebuild the container:
```bash
docker compose build
docker compose up
```

Or rebuild and start in one command:
```bash
docker compose up --build
```

### Viewing Logs

To view the application logs:
```bash
docker compose logs -f
```

### Common Troubleshooting

**Port 3000 already in use:**
- Stop any other services running on port 3000, or
- Change the port mapping in `docker-compose.yml` (e.g., `"3001:3000"`)

**Container won't start:**
- Check Docker is running: `docker ps`
- Rebuild the container: `docker compose build --no-cache`
- Check logs: `docker compose logs`

**Changes not reflecting:**
- Ensure volumes are properly mounted in `docker-compose.yml`
- Try restarting: `docker compose restart`

**Permission errors (Linux/Mac):**
- Ensure Docker has proper permissions
- Try: `sudo docker compose up` (not recommended for production)

### Development vs Production

- **Development**: Uses `Dockerfile.dev` with hot reload enabled
- **Production**: Uses `Dockerfile` with optimized build (set `DOCKER_BUILD=true` environment variable)

---

## Running the Website Locally

### Prerequisites

- **Node.js 20+** installed ([Download](https://nodejs.org/))
- **pnpm** installed (`npm install -g pnpm`)

### Setup Steps

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Create environment file** (required for Supabase):
   
   A `.env.local` file has been created automatically with the required Supabase configuration.
   If you need to recreate it, create a file named `.env.local` in the project root with:
   
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://sstmwvnstzwaopqjkurm.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_9A-6eeiFNGVJ1mZpVOX44A_fPrizqS9
   RESEND_API_KEY=re_VGFWxY7Z_BtYWLnAcjMywb2NVkGXou3fj
   EMAIL_FROM=DLSU Chorale <noreply@dlsuchorale.com>
   ```
   
   **Important:** The middleware requires `NEXT_PUBLIC_SUPABASE_ANON_KEY` (not `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`).

3. **Run development server**:
   ```bash
   pnpm dev
   ```

4. **Open your browser**: 
   - Main page: [http://localhost:3000](http://localhost:3000)
   - Login: [http://localhost:3000/login](http://localhost:3000/login)
   - Register: [http://localhost:3000/register](http://localhost:3000/register)
   - Attendance Form: [http://localhost:3000/attendance-form](http://localhost:3000/attendance-form)

### Stopping the Server

Press `Ctrl+C` in the terminal where the server is running.

### Common Errors

**"Missing Supabase environment variables" or middleware errors:**
- Ensure `.env.local` exists in the project root
- Restart the dev server after creating/updating `.env.local`
- Check that variable names match exactly (case-sensitive)

**Port 3000 already in use:**
- Stop other services using port 3000, or
- Run on a different port: `pnpm dev -- -p 3001`

**Module not found errors:**
- Delete `node_modules` and `.next` folders
- Run `pnpm install` again
- Restart the dev server

## Webpage Addresses

- **Home/Register Page**: [http://localhost:3000](http://localhost:3000)
- **Login Page**: [http://localhost:3000/login](http://localhost:3000/login)
- **Attendance Form**: [http://localhost:3000/attendance-form](http://localhost:3000/attendance-form)
- **Attendance Overview**: [http://localhost:3000/attendance-overview](http://localhost:3000/attendance-overview)
- **Profile**: [http://localhost:3000/profile](http://localhost:3000/profile)
- **Settings**: [http://localhost:3000/settings](http://localhost:3000/settings)

---

## Authentication: Google Sign-In

### Overview

The application supports **Google OAuth authentication** for both login and registration. Users can sign in or register using their Google account, which provides a seamless authentication experience.

### How It Works

#### For Login (`/login`)
1. User clicks **"Continue with Google"** button
2. Redirected to Google OAuth consent screen
3. After authentication, redirected to `/auth/callback-login`
4. System checks if user exists in the database
5. If verified, user is redirected to their dashboard
6. If not verified, user is redirected to pending verification page

#### For Registration (`/register`)
1. User fills out registration form (role, committee, etc.)
2. User clicks **"Continue with Google"** button
3. Registration data is stored temporarily in localStorage
4. Redirected to Google OAuth consent screen
5. After authentication, redirected to `/auth/callback`
6. System checks if email exists in Directory table
7. If valid, redirected to `/auth/setup` to complete profile creation
8. User profile is created with pending verification status
9. Admin must verify the account before full access is granted

### Supabase OAuth Configuration

Google OAuth is configured through **Supabase Dashboard**. No additional environment variables are required beyond the standard Supabase configuration.

#### Required Setup in Supabase Dashboard

1. **Navigate to Authentication → Providers** in your Supabase project
2. **Enable Google Provider**
3. **Configure Google OAuth**:
   - Add your Google OAuth Client ID
   - Add your Google OAuth Client Secret
   - Set authorized redirect URLs:
     - `http://localhost:3000/auth/callback` (for registration)
     - `http://localhost:3000/auth/callback-login` (for login)
     - Your production URLs (e.g., `https://yourdomain.com/auth/callback`)

#### Getting Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure OAuth consent screen (if not already done)
6. Add authorized redirect URIs:
   - `https://[your-project-ref].supabase.co/auth/v1/callback`
7. Copy the **Client ID** and **Client Secret**
8. Paste them into Supabase Dashboard → Authentication → Providers → Google

### OAuth Flow Details

#### Login Flow
```
User → /login → Click "Continue with Google" 
→ Google OAuth → /auth/callback-login 
→ Check Directory → Check Users table 
→ Redirect to dashboard or pending verification
```

#### Registration Flow
```
User → /register → Fill form → Click "Continue with Google"
→ Store form data in localStorage
→ Google OAuth → /auth/callback
→ Check Directory → /auth/setup
→ Create user profile → Redirect to dashboard (pending verification)
```

### Security Features

- ✅ **Email verification**: Only emails in the Directory table can register
- ✅ **Admin verification**: New users require admin approval before full access
- ✅ **Session management**: Secure session handling via Supabase Auth
- ✅ **Protected routes**: Middleware ensures authenticated users only
- ✅ **Role-based access**: Admin and member roles are enforced

### Local Development Considerations

- **Redirect URLs**: Ensure localhost URLs are added to Supabase redirect URLs
- **HTTPS**: Google OAuth requires HTTPS in production (localhost is exempt)
- **Testing**: Use test Google accounts or ensure your Google OAuth app allows test users

### Troubleshooting

**"OAuth error" or redirect fails:**
- Verify redirect URLs match exactly in Supabase Dashboard
- Check that Google OAuth credentials are correct
- Ensure Google OAuth app is not in testing mode (or add test users)

**"Email not in directory" error:**
- User's email must exist in the `Directory` table in Supabase
- Contact admin to add email to directory

**Session not persisting:**
- Clear browser cookies and try again
- Check that `.env.local` has correct Supabase credentials
- Verify middleware is working correctly

### Code Implementation

The Google OAuth implementation uses:
- **Frontend**: `supabase.auth.signInWithOAuth({ provider: "google" })`
- **Callbacks**: Server-side route handlers in `/app/auth/callback*`
- **Session**: Managed automatically by Supabase Auth helpers
- **Middleware**: Protects routes and handles authentication state

No additional code changes are needed - the OAuth flow is fully integrated!

