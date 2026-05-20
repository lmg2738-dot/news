$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
$s = New-Object -ComObject WScript.Shell
$p = Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs\Startup\CJNewsAlert.lnk'
$shortcut = $s.CreateShortcut($p)
$shortcut.TargetPath = Join-Path $dir 'run_cj_news_alert.bat'
$shortcut.WorkingDirectory = $dir
$shortcut.WindowStyle = 7
$shortcut.Description = 'CJ News Alert'
$shortcut.Save()
Write-Host "Created: $p"
