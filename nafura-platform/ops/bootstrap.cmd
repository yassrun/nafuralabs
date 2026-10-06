@echo off
rem Nafura toolchain bootstrap (Windows 10+): portable Node, then JDK and caches, outside the repository.
rem No admin rights, no PowerShell, nothing installed on the system: see ops\README.md, section Outillage.
rem   nafura-platform\ops\bootstrap.cmd
setlocal EnableExtensions

set "TOOLCHAIN=%NAFURA_TOOLCHAIN%"
if "%TOOLCHAIN%"=="" set "TOOLCHAIN=%LOCALAPPDATA%\nafura"
set "OPS=%~dp0"

set "NODE_VERSION="
for /f "usebackq eol=# tokens=1,* delims==" %%a in ("%OPS%..\stack.versions.properties") do (
  if "%%a"=="node.version" set "NODE_VERSION=%%b"
)
if "%NODE_VERSION%"=="" (
  echo ERREUR : node.version introuvable dans stack.versions.properties.
  exit /b 1
)

set "ARCH=x64"
if /i "%PROCESSOR_ARCHITECTURE%"=="ARM64" set "ARCH=arm64"
set "NODE_NAME=node-v%NODE_VERSION%-win-%ARCH%"
set "NODE_DIR=%TOOLCHAIN%\node\%NODE_NAME%"

echo Outillage Nafura dans %TOOLCHAIN%
if not exist "%TOOLCHAIN%\downloads" mkdir "%TOOLCHAIN%\downloads" || exit /b 1
if not exist "%TOOLCHAIN%\node" mkdir "%TOOLCHAIN%\node" || exit /b 1

if not exist "%NODE_DIR%\node.exe" (
  echo   telechargement de Node %NODE_VERSION%
  curl.exe -fsSL --retry 3 -o "%TOOLCHAIN%\downloads\%NODE_NAME%.zip" "https://nodejs.org/dist/v%NODE_VERSION%/%NODE_NAME%.zip" || (
    echo ERREUR : telechargement impossible. Proxy d'entreprise : definir HTTPS_PROXY.
    exit /b 1
  )
  tar.exe -xf "%TOOLCHAIN%\downloads\%NODE_NAME%.zip" -C "%TOOLCHAIN%\node" || exit /b 1
)

rem The rest (JDK, check of the Node archive's SHA-256, caches) is done by toolchain.mjs.
"%NODE_DIR%\node.exe" "%OPS%product\toolchain.mjs" install
exit /b %ERRORLEVEL%
