@echo off
setlocal

cd /d "%~dp0"

if not exist ".venv\Scripts\python.exe" (
  echo Creating virtual environment...
  python -m venv .venv
)

".venv\Scripts\python.exe" --version >nul 2>nul
if errorlevel 1 (
  echo Existing virtual environment is broken. Recreating it...
  rmdir /s /q .venv
  python -m venv .venv
)

echo Using Python:
".venv\Scripts\python.exe" --version

".venv\Scripts\python.exe" -m pip --version >nul 2>nul
if errorlevel 1 (
  echo pip is missing. Repairing pip...
  ".venv\Scripts\python.exe" -m ensurepip --upgrade
)

echo Checking backend dependencies...
".venv\Scripts\python.exe" -c "import fastapi, uvicorn, sqlalchemy, pymysql, dotenv, jose, passlib, pydantic" >nul 2>nul
if errorlevel 1 (
  echo Installing backend dependencies...
  ".venv\Scripts\python.exe" -m pip install -r requirements.txt
) else (
  echo Backend dependencies already installed.
)

echo Checking database connection...
".venv\Scripts\python.exe" check_db.py

echo Starting FastAPI backend...
".venv\Scripts\python.exe" -m uvicorn main:app --host 127.0.0.1 --port 8000
