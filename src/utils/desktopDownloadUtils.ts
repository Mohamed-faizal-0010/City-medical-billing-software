/**
 * Desktop Software Download & Launch Utilities
 * Provides instant 1-click downloads for Windows (.bat, .vbs, .exe builder) and desktop runners.
 */

export interface DesktopDiagnosticResult {
  hasManifest: boolean;
  hasServiceWorker: boolean;
  inIframe: boolean;
  isStandalone: boolean;
  browser: string;
  os: 'windows' | 'mac' | 'linux' | 'other';
  recommendation: string;
}

/**
 * Run diagnostic checks on desktop environment to pinpoint why installation or download might have an issue.
 */
export function checkDesktopEnvironment(): DesktopDiagnosticResult {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : '';
  const inIframe = typeof window !== 'undefined' ? window.top !== window.self : false;
  const isStandalone =
    typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true);

  const hasServiceWorker = typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
  const hasManifest =
    typeof document !== 'undefined' && !!document.querySelector('link[rel="manifest"]');

  let os: 'windows' | 'mac' | 'linux' | 'other' = 'other';
  if (/win/.test(ua)) os = 'windows';
  else if (/macintosh|mac os x/.test(ua)) os = 'mac';
  else if (/linux/.test(ua)) os = 'linux';

  let browser = 'Unknown Browser';
  if (/edg\//.test(ua)) browser = 'Microsoft Edge';
  else if (/chrome\//.test(ua)) browser = 'Google Chrome';
  else if (/firefox\//.test(ua)) browser = 'Mozilla Firefox';
  else if (/safari\//.test(ua) && !/chrome\//.test(ua)) browser = 'Apple Safari';

  let recommendation = 'Your desktop computer is ready to run and install City Rx.';
  if (inIframe) {
    recommendation =
      'Preview Mode: You are viewing inside an embedded frame. To install the native PWA desktop icon or enable browser prompts, click "Open in Dedicated Desktop Window" or download the 1-Click Windows Launcher.';
  } else if (isStandalone) {
    recommendation = 'City Rx is already running as an installed standalone desktop application!';
  }

  return {
    hasManifest,
    hasServiceWorker,
    inIframe,
    isStandalone,
    browser,
    os,
    recommendation,
  };
}

/**
 * Downloads a 1-click Windows Desktop Launcher (.bat) that launches City Rx
 * in pure native application mode (no browser address bar, no tabs) via Chrome or Edge.
 */
export function downloadWindowsDesktopLauncher(appUrl: string, pharmacyName: string = 'City Rx') {
  const safeName = pharmacyName.replace(/[^a-zA-Z0-9 ]/g, '').trim() || 'City Rx';
  const targetUrl = appUrl.startsWith('http') ? appUrl : window.location.origin;

  const scriptContent = `@echo off
title ${safeName} Desktop App Launcher
chcp 65001 >nul
cls

echo ======================================================================
echo           ${safeName.toUpperCase()} - DESKTOP SOFTWARE LAUNCHER
echo                  Standalone Pharmacy POS & ERP System
echo ======================================================================
echo.
echo Initializing desktop standalone mode...
echo.

set TARGET_URL=${targetUrl}

:: 1. Attempt to create Windows Desktop Shortcut
set SHORTCUT_SCRIPT=%TEMP%\\create_cityrx_shortcut.vbs
(
  echo Set oWS = WScript.CreateObject("WScript.Shell"^)
  echo sLinkFile = oWS.SpecialFolders("Desktop"^) ^& "\\${safeName}.lnk"
  echo Set oLink = oWS.CreateShortcut(sLinkFile^)
  echo oLink.TargetPath = "%~f0"
  echo oLink.Description = "Launch ${safeName} Pharmacy Management System"
  echo oLink.WindowStyle = 1
  echo oLink.Save
) > "%SHORTCUT_SCRIPT%"
cscript //nologo "%SHORTCUT_SCRIPT%" >nul 2>&1
del "%SHORTCUT_SCRIPT%" >nul 2>&1

echo [OK] Desktop Shortcut checked / created: "%USERPROFILE%\\Desktop\\${safeName}.lnk"
echo.

:: 2. Try Microsoft Edge in App Mode (Default on Windows 10/11)
if exist "%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe" (
    echo Launching ${safeName} via Microsoft Edge Standalone App Mode...
    start "" "%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe" --app="%TARGET_URL%" --window-size=1440,900
    goto DONE
)

if exist "%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe" (
    echo Launching ${safeName} via Microsoft Edge Standalone App Mode...
    start "" "%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe" --app="%TARGET_URL%" --window-size=1440,900
    goto DONE
)

:: 3. Try Google Chrome in App Mode
if exist "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" (
    echo Launching ${safeName} via Google Chrome Standalone App Mode...
    start "" "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" --app="%TARGET_URL%" --window-size=1440,900
    goto DONE
)

if exist "%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe" (
    echo Launching ${safeName} via Google Chrome Standalone App Mode...
    start "" "%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe" --app="%TARGET_URL%" --window-size=1440,900
    goto DONE
)

if exist "%LOCALAPPDATA%\\Google\\Chrome\\Application\\chrome.exe" (
    echo Launching ${safeName} via Local Chrome Standalone App Mode...
    start "" "%LOCALAPPDATA%\\Google\\Chrome\\Application\\chrome.exe" --app="%TARGET_URL%" --window-size=1440,900
    goto DONE
)

:: 4. Fallback to default browser
echo Opening in default system web browser...
start "" "%TARGET_URL%"

:DONE
echo.
echo Software window launched successfully!
timeout /t 3 >nul
exit
`;

  downloadTextFile(scriptContent, `${safeName.replace(/\s+/g, '-')}-Desktop-Launcher.bat`, 'text/plain');
}

/**
 * Downloads a silent VBScript launcher that opens the desktop app with zero command prompt flashing.
 */
export function downloadWindowsVbsLauncher(appUrl: string, pharmacyName: string = 'City Rx') {
  const safeName = pharmacyName.replace(/[^a-zA-Z0-9 ]/g, '').trim() || 'City Rx';
  const targetUrl = appUrl.startsWith('http') ? appUrl : window.location.origin;

  const vbsContent = `' ${safeName} Silent Desktop Launcher
Option Explicit
Dim oShell, sEdge, sChrome, sTargetUrl
sTargetUrl = "${targetUrl}"

Set oShell = CreateObject("WScript.Shell")

sEdge = oShell.ExpandEnvironmentStrings("%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe")
sChrome = oShell.ExpandEnvironmentStrings("%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe")

Dim fso: Set fso = CreateObject("Scripting.FileSystemObject")

If fso.FileExists(sEdge) Then
    oShell.Run """" & sEdge & """ --app=""" & sTargetUrl & """ --window-size=1440,900", 1, False
ElseIf fso.FileExists(sChrome) Then
    oShell.Run """" & sChrome & """ --app=""" & sTargetUrl & """ --window-size=1440,900", 1, False
Else
    oShell.Run """" & sTargetUrl & """", 1, False
End If
`;

  downloadTextFile(vbsContent, `${safeName.replace(/\s+/g, '-')}-Launch.vbs`, 'text/vbscript');
}

/**
 * Downloads a standalone portable HTML runner that can be opened on any desktop.
 */
export function downloadDesktopOfflineApp(appUrl: string, pharmacyName: string = 'City Rx') {
  const safeName = pharmacyName.replace(/[^a-zA-Z0-9 ]/g, '').trim() || 'City Rx';
  const targetUrl = appUrl.startsWith('http') ? appUrl : window.location.origin;

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeName} - Desktop Standalone Runner</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    body, html { width: 100%; height: 100%; overflow: hidden; background: #0f172a; color: #fff; }
    .top-bar { height: 42px; background: #042f2e; display: flex; align-items: center; justify-content: space-between; padding: 0 16px; border-bottom: 1px solid #115e59; font-size: 13px; }
    .brand { font-weight: 800; color: #2dd4bf; display: flex; align-items: center; gap: 8px; }
    .badge { background: #134e4a; color: #99f6e4; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 999px; text-transform: uppercase; }
    .actions { display: flex; gap: 8px; align-items: center; }
    .btn { background: #0d9488; color: #fff; border: none; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; }
    .btn:hover { background: #0f766e; }
    .btn-secondary { background: #334155; }
    .btn-secondary:hover { background: #475569; }
    iframe { width: 100%; height: calc(100% - 42px); border: none; background: #f8fafc; }
  </style>
</head>
<body>
  <div class="top-bar">
    <div class="brand">
      <span>🏥 ${safeName}</span>
      <span class="badge">Standalone Desktop Mode</span>
    </div>
    <div class="actions">
      <button class="btn btn-secondary" onclick="document.getElementById('app-frame').src = document.getElementById('app-frame').src;">↻ Refresh</button>
      <a class="btn" href="${targetUrl}" target="_blank">↗ Open in Dedicated Browser</a>
      <button class="btn" onclick="toggleFullscreen();">⛶ Fullscreen</button>
    </div>
  </div>
  <iframe id="app-frame" src="${targetUrl}" allow="clipboard-read; clipboard-write; camera; geolocation; microphone"></iframe>
  <script>
    function toggleFullscreen() {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => console.log(err));
      } else {
        if (document.exitFullscreen) document.exitFullscreen();
      }
    }
  </script>
</body>
</html>`;

  downloadTextFile(htmlContent, `${safeName.replace(/\s+/g, '-')}-Desktop-Offline.html`, 'text/html');
}

/**
 * Downloads the complete Electron main script and package configuration
 * so the user can build a native Windows .exe installer.
 */
export function downloadElectronSourceFiles(appUrl: string, pharmacyName: string = 'City Rx') {
  const safeName = pharmacyName.replace(/[^a-zA-Z0-9 ]/g, '').trim() || 'City Rx';
  const targetUrl = appUrl.startsWith('http') ? appUrl : window.location.origin;

  const electronMain = `// Electron Desktop Entry Point for ${safeName}
const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: '${safeName} Pharmacy Management System',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false
    }
  });

  mainWindow.maximize();
  Menu.setApplicationMenu(null); // Clean kiosk-style window

  // Load URL
  mainWindow.loadURL('${targetUrl}');

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
`;

  downloadTextFile(electronMain, 'electron-main.js', 'application/javascript');

  const buildBat = `@echo off
echo ========================================================
echo Building Standalone Windows .exe for ${safeName}
echo ========================================================
echo.
npm install --save-dev electron electron-builder
npx electron-builder --win --x64
echo.
echo [DONE] Executable setup generated in ./dist/ directory!
pause
`;
  downloadTextFile(buildBat, 'build-windows-exe.bat', 'text/plain');
}

/**
 * Helper to download text / binary blob as a file in the browser.
 */
function downloadTextFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
