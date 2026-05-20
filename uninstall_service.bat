@echo off
chcp 65001 >nul
echo ============================================
echo   CJ 뉴스 알림 - 자동 실행 해제
echo ============================================
echo.

net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [오류] 관리자 권한이 필요합니다.
    echo        이 파일을 우클릭 → "관리자 권한으로 실행" 해주세요.
    pause
    exit /b 1
)

schtasks /delete /tn "CJNewsAlert" /f

if %errorLevel% equ 0 (
    echo.
    echo [성공] "CJNewsAlert" 작업이 제거되었습니다.
) else (
    echo.
    echo [알림] 등록된 작업이 없거나 이미 제거되었습니다.
)

echo.
pause
