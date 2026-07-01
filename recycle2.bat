@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

set "COUNT=0"

call :recycle "D:\- 酒馆\反向代理\new-api\web\default\src\features\system-settings\integrations\waffo-settings-section.tsx"
call :recycle "D:\- 酒馆\反向代理\new-api\web\default\src\features\system-settings\integrations\waffo-pancake-settings-section.tsx"
call :recycle "D:\- 酒馆\反向代理\new-api\web\default\src\features\system-settings\integrations\waffo-pancake-api.ts"
call :recycle "D:\- 酒馆\反向代理\new-api\web\default\src\features\system-settings\integrations\payment-method-dialog.tsx"
call :recycle "D:\- 酒馆\反向代理\new-api\web\default\src\features\system-settings\integrations\payment-methods-visual-editor.tsx"
call :recycle "D:\- 酒馆\反向代理\new-api\web\default\src\features\system-settings\integrations\creem-products-visual-editor.tsx"
call :recycle "D:\- 酒馆\反向代理\new-api\web\default\src\features\system-settings\integrations\creem-product-dialog.tsx"
call :recycle "D:\- 酒馆\反向代理\new-api\web\default\src\features\system-settings\integrations\amount-discount-dialog.tsx"
call :recycle "D:\- 酒馆\反向代理\new-api\web\default\src\features\system-settings\integrations\amount-discount-visual-editor.tsx"
call :recycle "D:\- 酒馆\反向代理\new-api\web\default\src\features\system-settings\integrations\amount-options-visual-editor.tsx"

echo Done. Total moved: %COUNT%
endlocal
exit /b

:recycle
if exist %1 (
  powershell -Command "Add-Type -AssemblyName Microsoft.VisualBasic; [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteFile('%~1', 'OnlyErrorDialogs', 'SendToRecycleBin')"
  echo Moved: %~1
  set /a COUNT+=1
  timeout /t 1 /nobreak >nul
) else (
  echo Not found: %~1
)
exit /b
