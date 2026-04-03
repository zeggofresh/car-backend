@echo off
echo ========================================
echo   Testing Database and FTP Connections
echo ========================================
echo.

echo [1/2] Testing Database Connection...
npx tsx check_db.ts
echo.

echo [2/2] Testing FTP Connection...
npx tsx ftp-connect.ts
echo.

echo ========================================
echo   Test Complete
echo ========================================
pause
