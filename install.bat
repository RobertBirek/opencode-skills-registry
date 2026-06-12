@echo off
setlocal enabledelayedexpansion

echo === opencode-skills-registry Installer for Windows ===
echo.

set CONFIG_DIR=%USERPROFILE%\.config\opencode
set SKILLS_REGISTRY=%CONFIG_DIR%\skills-registry
set SKILLS_DIR=%CONFIG_DIR%\skills
set COMMANDS_DIR=%CONFIG_DIR%\commands
set REPO_DIR=%~dp0

REM Strip trailing backslash
if "%REPO_DIR:~-1%"=="\" set REPO_DIR=%REPO_DIR:~0,-1%
if "%REPO_DIR:~-1%"=="\" set REPO_DIR=%REPO_DIR:~0,-1%

echo Installing to: %CONFIG_DIR%
echo.

REM Create directories
if not exist "%SKILLS_REGISTRY%" mkdir "%SKILLS_REGISTRY%"
if not exist "%SKILLS_DIR%" mkdir "%SKILLS_DIR%"
if not exist "%COMMANDS_DIR%" mkdir "%COMMANDS_DIR%"

REM Copy registry (overwrite)
echo Copying registry files...
xcopy /E /I /Y "%REPO_DIR%\registry\*" "%SKILLS_REGISTRY%\" > nul

REM Copy skills (merge — don't overwrite custom skills)
for /D %%d in ("%REPO_DIR%\skills\*") do (
    set SKILL_NAME=%%~nxd
    if not exist "%SKILLS_DIR%\!SKILL_NAME!" (
        xcopy /E /I "%%d" "%SKILLS_DIR%\!SKILL_NAME!\" > nul
        echo    + skill !SKILL_NAME!
    ) else (
        echo    skill '!SKILL_NAME!' already exists, skipping
    )
)

REM Copy commands (merge — don't overwrite)
for %%f in ("%REPO_DIR%\commands\*.md") do (
    set CMD_FILE=%%~nxf
    if not exist "%COMMANDS_DIR%\!CMD_FILE!" (
        copy "%%f" "%COMMANDS_DIR%\!CMD_FILE!" > nul
        echo    + command !CMD_FILE!
    ) else (
        echo    command '!CMD_FILE!' already exists, skipping
    )
)

REM Sync FrancoStino vault
echo.
echo Syncing FrancoStino vault...
where node > nul 2>&1
if %ERRORLEVEL% equ 0 (
    node "%SKILLS_REGISTRY%\scripts\sync-francostino-upstream.mjs"
) else (
    echo WARNING: Node.js not found. Run the sync manually after installing Node.js:
    echo   node "%%USERPROFILE%%\.config\opencode\skills-registry\scripts\sync-francostino-upstream.mjs"
)

echo.
echo === Done ===
echo Restart opencode, then run /init-skills inside a project.
echo.
pause
