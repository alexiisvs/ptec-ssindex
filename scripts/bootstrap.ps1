$ErrorActionPreference = "Stop"

npm --prefix frontend install

if (-not (Test-Path "backend/.venv")) {
    python -m venv backend/.venv
}

& backend/.venv/Scripts/python.exe -m pip install --upgrade pip
& backend/.venv/Scripts/python.exe -m pip install -r backend/requirements.txt
