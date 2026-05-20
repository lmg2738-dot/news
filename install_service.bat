@echo off
chcp 65001 >nul
echo ============================================
echo   CJ 뉴스 알림 - 작업 스케줄러 등록
echo   (관리자 권한 필요 · 로그온 시 실행)
echo ============================================
echo.
echo ※ 관리자 없이 쓰려면 install_startup.bat 을 사용하세요.
echo.

net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [오류] 관리자 권한이 필요합니다.
    echo        이 파일을 우클릭 → "관리자 권한으로 실행" 해주세요.
    pause
    exit /b 1
)

set "SCRIPT_DIR=%~dp0"
if not exist "%SCRIPT_DIR%run_cj_news_alert.bat" (
    echo [오류] run_cj_news_alert.bat 이 없습니다.
    pause
    exit /b 1
)

echo 실행: %SCRIPT_DIR%run_cj_news_alert.bat
echo.

schtasks /delete /tn "CJNewsAlert" /f >nul 2>&1

schtasks /create /tn "CJNewsAlert" /tr "%SCRIPT_DIR%run_cj_news_alert.bat" /sc onlogon /rl highest /f

if %errorLevel% equ 0 (
    echo.
    echo [성공] "CJNewsAlert" 작업이 등록되었습니다.
    echo        다음 로그인 시 자동으로 실행됩니다.
    echo.
    echo 지금 바로 시작: schtasks /run /tn "CJNewsAlert"
) else (
    echo.
    echo [오류] 작업 등록에 실패했습니다.
)

echo.
pause
