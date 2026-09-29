@echo off
chcp 65001 >nul
title PetLife AI 本地网站
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo [无法启动] 没有找到 Node.js。
  echo 请先安装 Node.js 22 或更高版本。
  pause
  exit /b 1
)

if not exist "node_modules\.bin\vinext.cmd" (
  echo 首次运行，正在安装项目依赖...
  call npm install
  if errorlevel 1 (
    echo [无法启动] 项目依赖安装失败，请检查网络后重试。
    pause
    exit /b 1
  )
)

echo 正在启动 PetLife AI...
echo 浏览器地址：http://localhost:3000/
echo.
echo 请保持这个窗口开启；关闭窗口后网站会停止。
echo 首次打开若显示空白，请等待几秒后刷新浏览器。
echo.
start "" "http://localhost:3000/"
call ".\node_modules\.bin\vinext.cmd" dev

echo.
echo 网站已经停止。
pause
