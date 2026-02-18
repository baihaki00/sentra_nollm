@echo off
setlocal
:: Get the directory where this batch file is located
set "PROJECT_ROOT=%~dp0"
cd /d "%PROJECT_ROOT%"

if "%1"=="--sleep" (
    echo [Sentra] Entering Sleep Cycle...
    node scripts/sleep.js
) else if "%1"=="--help" (
    echo Sentra CLI v0.4
    echo Usage: 
    echo   sen           Launch the interactive CLI
    echo   sen --sleep   Run the autonomous sleep/consolidation cycle
    echo   sen --help    Show this help message
) else (
    node core/main_loop.js %*
)
