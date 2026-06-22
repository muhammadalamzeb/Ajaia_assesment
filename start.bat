@echo off
cd /d "%~dp0"
echo.
echo === Ajaia Docs - Starting ===
echo.

where node >nul 2>&1 || (
  echo ERROR: Node.js is not installed. Install from https://nodejs.org
  pause
  exit /b 1
)

if not exist "server\node_modules\" (
  echo Installing dependencies...
  call npm run install:all
)

if not exist "client\dist\index.html" (
  echo Building frontend...
  call npm run build
)

if not exist "server\data\ajaia-docs.db" (
  echo Seeding database...
  call npm run seed
)

echo.
echo Starting server at http://localhost:3001
echo Login: alice@ajaia.dev / password123
echo.
echo Press Ctrl+C to stop.
echo.

npm start
