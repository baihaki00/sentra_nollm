@echo off
setlocal enabledelayedexpansion
:: Get the directory where this batch file is located
set "PROJECT_ROOT=%~dp0"
cd /d "%PROJECT_ROOT%"

if "%1"=="--sleep" (
    echo [Sentra] Entering Sleep Cycle...
    node scripts/sleep.js
) else if "%1"=="--all" (
    echo [System] Sequential Optimization Mode...
    echo [1/2] Consolidation...
    node scripts/sleep.js
    echo [2/2] Launching Core...
    call :launch_sbi
    node core/main_loop.js
) else if "%1"=="--reset" (
    echo [System] CAUTION: Clearing Cold/Hot Memory...
    del /q data\hot\*.*
    echo [System] Memory Wipe Complete.
) else if "%1"=="--force" (
    echo [System] Force Recovery: Terminating background SBI sessions...
    :: Use port-based kill to find hidden processes on 5173-5176 specifically in LISTENING state
    for %%p in (5173 5174 5175 5176) do (
        for /f "tokens=5" %%a in ('netstat -ano ^| findstr /R /C:":%%p " ^| findstr "LISTENING"') do (
            echo [System] Killing process %%a on port %%p...
            taskkill /pid %%a /f >nul 2>&1
        )
    )
    taskkill /fi "windowtitle eq Sentra Brain Inspector*" /f >nul 2>&1
    echo [System] Restarting...
    call :launch_sbi
    node core/main_loop.js %2 %3 %4
) else if "%1"=="--sbi" (
    echo [System] Manual SBI Launch...
    call :launch_sbi
    echo [System] Inspector launch command sent.
) else if "%1"=="--help" (
    echo Sentra CLI v0.5
    echo Usage: 
    echo   sen           Launch Core + Inspector ^(Smart^)
    echo   sen --force   Kill ghost SBI sessions and restart
    echo   sen --sbi     Launch Inspector ONLY
    echo   sen --all     Run Sleep -^> Core
    echo   sen --debugall Show ALL logs in CLI
    echo   sen --homeo   Show Homeostasis logs
    echo   sen --stm     Show STM logs
    echo   sen --reset   Clear all temporary memory
    echo   sen --help    Show this help message
) else (
    call :launch_sbi
    node core/main_loop.js %*
)
goto :eof

:launch_sbi
:: Check if port range 5173-5176 is already in use (Only LISTENING counts)
set "SBI_PORT_FOUND=0"
for %%p in (5173 5174 5175 5176) do (
    netstat -ano | findstr /R /C:":%%p " | findstr "LISTENING" >nul
    if !errorlevel! equ 0 set "SBI_PORT_FOUND=1"
)

if %SBI_PORT_FOUND% equ 1 (
    echo [System] Sentra Brain Inspector ^(SBI^) is already active.
    echo [Tip] If the window is missing, use 'sen --force' to reset it.
) else (
    echo [System] Initializing Sentra Brain Inspector...
    start "Sentra Brain Inspector" /min cmd /c "cd /d %PROJECT_ROOT%\..\sentra-brain-inspector && npm run dev"
)
goto :eof
