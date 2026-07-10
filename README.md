# ZenBlog Client

Next.js App Router frontend for **ZenBlog**, paired with the ASP.NET Core API in the sibling `ZenBlogServer` folder.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS
- TanStack Query for server state
- In-memory JWT auth (no `localStorage`)

## Project structure

```
src/
  api/           # HTTP client, DTOs, resource helpers
  app/           # Routes (home, login, blogs, dashboard)
  components/    # Shared UI (auth guard, skeletons, comments)
  context/       # AuthContext
  providers/     # React Query + toast providers
```

## Getting started

### Prerequisites

- Node.js 20+
- Running ZenBlog API at `https://localhost:7117` (see backend launch profile)

### Install & run

```bash
cd zenblog_client
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment

Create `.env.local` (not committed):

```env
NEXT_PUBLIC_API_URL=https://localhost:7117
```

---

## Local testing checklist

### 1. Verify backend CORS configuration

Open `ZenBlogServer/Presentation/ZenBlog.API/Program.cs` and confirm a CORS policy allows your frontend origin (default Next.js port **3000**):

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000") // Your Next.js local URL
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// ...

// Must be placed BEFORE MapControllers / MapGroup endpoints
app.UseCors("AllowFrontend");
```

Without this, the browser blocks API calls with a CORS error.

If `npm run dev` uses another port (e.g. `3001`), add that origin to `WithOrigins(...)` and restart the API.

### 2. Point the client at the API

Ensure `.env.local` matches the API HTTPS URL above (`launchSettings.json` profile `https` → `https://localhost:7117`).

### 3. Trust the local HTTPS certificate (Windows)

```bash
dotnet dev-certs https --trust
```

### 4. Run both apps

**Terminal A — API**

```bash
cd ZenBlogServer/Presentation/ZenBlog.API
dotnet run --launch-profile https
```

API: [https://localhost:7117](https://localhost:7117) (Scalar often at `/scalar`)

**Terminal B — Client**

```bash
cd zenblog_client
npm run dev
```

Client: [http://localhost:3000](http://localhost:3000)

### 5. Smoke-test the UI

1. `/` — blogs and categories load (or show a clear error).
2. `/login` — sign in (JWT stays in memory; refresh clears the session).
3. `/blogs/new` — create a post (auth required).
4. `/blogs/[id]` — read a post; add comments / replies while signed in.

## Auth note

Access tokens are **not** stored in `localStorage` (XSS mitigation). A full page refresh logs you out; that is expected.

On `401 Unauthorized` from authenticated API calls, the client clears session state and redirects to `/login`.
