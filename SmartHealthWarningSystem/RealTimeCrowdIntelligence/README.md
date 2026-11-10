# Real-Time Crowd Intelligence Platform

A full-stack platform for collecting, visualizing, and analyzing crowd reports in real time.

## Stack

- React + Tailwind CSS
- Node.js + Express.js
- MongoDB Atlas + Mongoose
- Socket.IO
- JWT authentication with user/admin roles
- Leaflet heatmap and Recharts dashboards

## Structure

```text
client/   React app, dashboard UI, maps, charts, auth state
server/   Express REST API, Socket.IO, MongoDB models, controllers
```

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Set `MONGODB_URI` to your MongoDB Atlas connection string. If you want to run against a local database instead, start MongoDB locally and use:

```bash
MONGODB_URI=mongodb://127.0.0.1:27017/crowd-intelligence
```

3. Seed demo users and reports:

```bash
npm run seed
```

4. Run the app:

```bash
npm run dev
```

The client runs on `http://localhost:5173`; the API runs on `http://localhost:5001`.
If Vite shows a network URL such as `http://192.168.x.x:5173`, the client will call the API on the same host at port `5001`.

## Authentication Troubleshooting

- If the server logs `querySrv ENOTFOUND _mongodb._tcp...`, authentication is not the failing part yet: the API crashed before it could serve `/api/auth/login`. Replace `server/.env` `MONGODB_URI` with a valid current Atlas connection string, allow your IP in Atlas Network Access, or use a running local MongoDB URI.
- After changing the database URI, run `npm run seed` again if you want to use the demo credentials.
- If you opened the app from a LAN URL, restart `npm run dev` after changing environment variables.

## Demo Accounts After Seeding

- Admin: `admin@crowdintel.local` / `Admin123!`
- User: `user@crowdintel.local` / `User123!`

## Deployment

- Use `render.yaml` to deploy the monorepo as one Node service that serves both API and the compiled React app.
- Use `Dockerfile` for container hosts.
- Deploy `client/` separately to Vercel or Netlify when you want split frontend/API hosting.
- Set production environment variables:
  - `server`: `MONGODB_URI`, `JWT_SECRET`, `CLIENT_ORIGIN`, `PORT`
  - `client`: `VITE_API_URL`, `VITE_SOCKET_URL`

The Express server also serves the compiled frontend when `client/dist` is available beside the monorepo root.
