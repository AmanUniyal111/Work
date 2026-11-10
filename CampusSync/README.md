# CampusSync

CampusSync is a full-stack campus platform built to bring common student-facing workflows into one place. It combines authentication, anonymous Q&A, squad formation, event management, and notifications in a single web application.

The project is split into two parts:

- `frontend` - React + Vite
- `backend` - Node.js + Express + MongoDB

## Features

- Secure authentication with JWT
- Institutional email-based registration
- Student accounts created by default during registration
- Anonymous Q&A posting and answering
- Squad finder for team creation and joining
- Event listing, creation, and registration
- Notification center with admin broadcast support

## Tech Stack

- Frontend: React, Vite, CSS
- Backend: Node.js, Express.js
- Database: MongoDB Atlas with Mongoose
- Authentication: JWT, bcrypt
- Deployment: Vercel (frontend), Render (backend)

## Project Structure

```text
CampusSync/
├── backend/
│   ├── src/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   └── server.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.jsx
│   ├── .env.example
│   └── package.json
└── README.md
```

## Local Setup

### 1. Clone and open the project

```bash
git clone https://github.com/pragatinautiyal/Campus_sync_fullstack.git
cd Campus_sync_fullstack
```

### 2. Configure the backend

Create a `.env` file inside `backend` using `backend/.env.example` as reference.

Example:

```env
PORT=5000
MONGO_URI=mongodb+srv://<db_user>:<db_password>@<cluster-name>.mongodb.net/campussync?retryWrites=true&w=majority&appName=<cluster-name>
JWT_SECRET=replace_with_a_long_random_secret
ALLOWED_ORIGIN=http://localhost:5173
```

Install dependencies and start the backend:

```bash
cd backend
npm install
npm run dev
```

Backend runs on:

```text
http://localhost:5000
```

Health check:

```text
http://localhost:5000/api/health
```

### 3. Configure the frontend

Create a `.env` file inside `frontend` using `frontend/.env.example` as reference.

Example:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Install dependencies and start the frontend:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on:

```text
http://localhost:5173
```

## MongoDB Atlas Setup

1. Create a MongoDB Atlas cluster.
2. Create a database user in `Database Access`.
3. Add your IP address in `Network Access`.
4. Create a database, for example `campussync`.
5. Create collections manually if you want them visible immediately:
   - `users`
   - `questions`
   - `teams`
   - `events`
   - `notifications`

You can also skip manual collection creation. MongoDB will create collections automatically when the app writes data for the first time.

## Authentication and Roles

- New registrations are created with the `student` role by default.
- Users can no longer choose `mentor` or `admin` while signing up.
- Protected routes use JWT-based authentication.
- Role-based authorization is enforced on restricted actions such as event creation and admin broadcasts.

If you need to promote a user:

1. Open MongoDB Atlas.
2. Go to `Browse Collections`.
3. Open the `users` collection.
4. Edit the `role` field for that user to `mentor` or `admin`.

## Deployment

### Backend on Render

Use the `backend` folder as the service root.

Render settings:

- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `npm start`

Environment variables:

```env
PORT=5000
MONGO_URI=your_atlas_connection_string
JWT_SECRET=your_long_random_secret
ALLOWED_ORIGIN=http://localhost:5173,https://your-vercel-app.vercel.app
```

After deployment, test:

```text
https://your-render-service.onrender.com/api/health
```

### Frontend on Vercel

Use the `frontend` folder as the root directory.

Vercel settings:

- Framework Preset: `Vite`
- Root Directory: `frontend`
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `dist`

Environment variable:

```env
VITE_API_BASE_URL=https://your-render-service.onrender.com/api
```

If you update `VITE_API_BASE_URL`, redeploy Vercel.

If you update `ALLOWED_ORIGIN`, redeploy Render.

## Available Scripts

### Backend

```bash
npm run dev
npm start
```

### Frontend

```bash
npm run dev
npm run build
npm run preview
```

## Notes

- `Cannot GET /` on the Render base URL is expected because the backend does not define a root route.
- Use `/api/health` to confirm the backend is running.
- If the frontend shows `Failed to fetch` after deployment, check:
  - `VITE_API_BASE_URL`
  - `ALLOWED_ORIGIN`
  - whether both services were redeployed after env changes
  - whether the frontend origin exactly matches the value allowed by CORS

## Future Improvements

- Admin panel for role management
- Better search and filtering
- Real-time notification support
- Better analytics and reporting
- Production-grade validation and test coverage
