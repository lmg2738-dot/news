@echo off
chcp 65001 >nul
set "LNK=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\CJNewsAlert.lnk"
if exist "%LNK%" (
    del "%LNK%"
    echo [완료] 시작 프로그램에서 CJNewsAlert 를 제거했습니다.
) else (
    echo [알림] CJNewsAlert.lnk 가 없습니다.
)
echo.
pause
