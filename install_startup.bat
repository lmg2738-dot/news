@echo off
chcp 65001 >nul
echo ============================================
echo   CJ 뉴스 알림 - 시작 프로그램에 등록
echo   (로그인 시 자동 실행 · 관리자 권한 불필요)
echo ============================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0_install_startup.ps1"

if %errorLevel% neq 0 (
    echo [오류] 바로가기를 만들지 못했습니다.
    pause
    exit /b 1
)

echo.
echo 다음 로그인(또는 재부팅 후 로그인)부터 자동으로 실행됩니다.
echo 지금 테스트: run_cj_news_alert.bat
echo.
pause
