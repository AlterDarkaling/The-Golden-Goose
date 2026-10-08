@echo off
chcp 65001 >nul
echo ========================================
echo   大鹅爱记账 - 后端服务启动脚本
echo ========================================
echo.

cd /d "%~dp0backend"

if not exist "node_modules" (
    echo [1/2] 首次运行，正在安装依赖...
    call npm install
    echo.
)

echo [2/2] 启动后端服务...
echo.
echo 服务将运行在: http://localhost:3000
echo 按 Ctrl+C 可停止服务
echo.
echo ========================================
echo.

call npm run dev

pause

