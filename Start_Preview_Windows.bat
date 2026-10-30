@echo off
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 (
  start "" "http://localhost:8000/"
  py -m http.server 8000
) else (
  where python >nul 2>nul
  if %errorlevel%==0 (
    start "" "http://localhost:8000/"
    python -m http.server 8000
  ) else (
    echo Python is required for this local preview.
    echo You may also deploy the folder to any static web host.
    pause
  )
)
