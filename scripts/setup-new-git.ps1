# 새 폴더에 프로젝트 복사 + git 초기화 + remote 연결
# 사용:
#   .\scripts\setup-new-git.ps1 -TargetDir "C:\path\NEW-LOTTE" -RemoteUrl "https://github.com/user/repo.git"

param(
  [Parameter(Mandatory = $true)]
  [string]$TargetDir,
  [Parameter(Mandatory = $true)]
  [string]$RemoteUrl
)

$SourceDir = Split-Path $PSScriptRoot -Parent

Write-Host "원본: $SourceDir"
Write-Host "대상: $TargetDir"

if (Test-Path $TargetDir) {
  Write-Error "대상 폴더가 이미 있습니다: $TargetDir"
  exit 1
}

Copy-Item -Recurse $SourceDir $TargetDir

$exclude = @(".git", "node_modules", ".next", ".vercel")
foreach ($name in $exclude) {
  $p = Join-Path $TargetDir $name
  if (Test-Path $p) {
    Remove-Item -Recurse -Force $p
  }
}

Set-Location $TargetDir
git init
git add .
git commit -m "init: news monitor instance"
git branch -M main
git remote add origin $RemoteUrl

Write-Host ""
Write-Host "완료. 다음을 실행하세요:"
Write-Host "  cd `"$TargetDir`""
Write-Host "  copy .env.example .env.local   # 값 편집 (docs/NEW-INSTANCE.md)"
Write-Host "  git push -u origin main"
