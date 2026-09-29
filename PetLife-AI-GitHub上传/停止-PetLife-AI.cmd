@echo off
chcp 65001 >nul
title 停止 PetLife AI
for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do taskkill /PID %%P /F >nul 2>nul
echo PetLife AI 本地网站已停止。
timeout /t 2 >nul
