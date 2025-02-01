@echo off
chcp 65001 > nul
title 星际指挥系统启动器
color 0A

echo [信息] 作战控制连线...

:: 检查Python是否安装
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo 使用已安装的Python启动游戏...
    python launcher.py
) else (
    :: 如果没有安装Python,使用内置的便携版Python
    echo 使用便携版Python启动游戏...
    if not exist "python_portable" (
        echo 首次运行,正在准备运行环境...
        powershell -Command "& {Invoke-WebRequest -Uri 'https://www.python.org/ftp/python/3.9.7/python-3.9.7-embed-amd64.zip' -OutFile 'python.zip'}"
        md python_portable
        powershell -Command "& {Expand-Archive -Path 'python.zip' -DestinationPath 'python_portable' -Force}"
        del python.zip
    )
    echo 环境准备完成!
    echo 正在启动游戏...
    .\python_portable\python.exe launcher.py
)

:: 如果发生错误则暂停
if errorlevel 1 (
    echo 启动失败! 
    echo 请确保网络连接正常或联系技术支持。
    pause
    exit /b 1
)

:: 正常退出
exit /b 0