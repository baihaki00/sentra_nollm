@echo off
setlocal
set "PROJECT_ROOT=%~dp0"
cd /d "%PROJECT_ROOT%\..\sentra-brain-inspector"
echo [System] Initializing Sentra Brain Inspector...
npm run dev
