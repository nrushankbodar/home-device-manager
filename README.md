# Home Device Manager

Full stack web app for managing rooms and devices with JWT authentication.

## Backend

1. Create `backend/.env`:

```env
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DATABASE=home_device_manager
SECRET_KEY=replace-with-a-long-random-secret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

2. Install and run:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\activate
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload
```

The API runs at `http://localhost:8000`.

On Windows PowerShell, you can also run:

```powershell
cd backend
.\run_backend.ps1
```

If PowerShell blocks scripts, run the batch file instead:

```powershell
cd backend
.\run_backend.bat
```

## Frontend

1. Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000
```

2. Install and run:

```powershell
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173`.

## API

- `POST /auth/register`
- `POST /auth/login`
- `GET /rooms`
- `POST /rooms`
- `DELETE /rooms/{id}`
- `GET /devices`
- `POST /devices`
- `PATCH /devices/{id}/toggle`
- `DELETE /devices/{id}`
