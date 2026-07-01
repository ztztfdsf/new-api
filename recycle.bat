@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
set "BASE=D:\- 酒馆\反向代理\new-api"
set "COUNT=0"
for %%F in (
  "web\default\src\features\system-settings\integrations\payment-settings-section.tsx"
  "web\default\src\features\system-settings\integrations\waffo-settings-section.tsx"
  "web\default\src\features\system-settings\integrations\waffo-pancake-settings-section.tsx"
  "web\default\src\features\system-settings\integrations\waffo-pancake-api.ts"
  "web\default\src\features\system-settings\integrations\payment-method-dialog.tsx"
  "web\default\src\features\system-settings\integrations\payment-methods-visual-editor.tsx"
  "web\default\src\features\system-settings\integrations\creem-products-visual-editor.tsx"
  "web\default\src\features\system-settings\integrations\creem-product-dialog.tsx"
  "web\default\src\features\system-settings\integrations\amount-discount-dialog.tsx"
  "web\default\src\features\system-settings\integrations\amount-discount-visual-editor.tsx"
  "web\default\src\features\system-settings\integrations\amount-options-visual-editor.tsx"
) do (
  if exist "!BASE!\%%~F" (
    powershell -Command "$shell = New-Object -ComObject Shell.Application; $bin = $shell.NameSpace(0xA); $bin.MoveHere('!BASE!\%%~F')"
    echo Moved: %%~F
    set /a COUNT+=1
    timeout /t 1 /nobreak >nul
  ) else (
    echo Not found: %%~F
  )
)
echo Done. Total moved: !COUNT!
endlocal
