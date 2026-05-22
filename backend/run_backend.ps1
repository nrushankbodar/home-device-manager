$ErrorActionPreference = "Stop"

if (!(Test-Path ".\.venv\Scripts\python.exe")) {
    Write-Host "Creating virtual environment..."
    python -m venv .venv
}

$python = ".\.venv\Scripts\python.exe"

try {
    & $python --version | Out-Null
} catch {
    Write-Host "Existing virtual environment is broken. Recreating it..."
    Remove-Item -LiteralPath ".\.venv" -Recurse -Force
    python -m venv .venv
}

Write-Host "Using Python:"
& $python --version

& $python -m pip --version | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "pip is missing. Repairing pip..."
    & $python -m ensurepip --upgrade
}

Write-Host "Checking backend dependencies..."
& $python -c "import fastapi, uvicorn, sqlalchemy, pymysql, dotenv, jose, passlib, pydantic" | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Installing backend dependencies..."
    & $python -m pip install -r requirements.txt
} else {
    Write-Host "Backend dependencies already installed."
}

Write-Host "Checking database connection..."
& $python check_db.py

Write-Host "Starting FastAPI backend..."
& $python -m uvicorn main:app --host 127.0.0.1 --port 8000
