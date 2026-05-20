@echo off
cd /d "%~dp0"
if exist "%~dp0.venv\Scripts\pythonw.exe" (
    "%~dp0.venv\Scripts\pythonw.exe" "%~dp0cj_news_alert.py"
) else (
    pythonw "%~dp0cj_news_alert.py"
)
