$recycleBin = (New-Object -ComObject Shell.Application).NameSpace(0xA)
$base = 'D:\- 酒馆\反向代理\new-api'
$items = @(
  'web\default\src\features\system-settings\integrations\payment-settings-section.tsx',
  'web\default\src\features\system-settings\integrations\waffo-settings-section.tsx',
  'web\default\src\features\system-settings\integrations\waffo-pancake-settings-section.tsx',
  'web\default\src\features\system-settings\integrations\waffo-pancake-api.ts',
  'web\default\src\features\system-settings\integrations\payment-method-dialog.tsx',
  'web\default\src\features\system-settings\integrations\payment-methods-visual-editor.tsx',
  'web\default\src\features\system-settings\integrations\creem-products-visual-editor.tsx',
  'web\default\src\features\system-settings\integrations\creem-product-dialog.tsx',
  'web\default\src\features\system-settings\integrations\amount-discount-dialog.tsx',
  'web\default\src\features\system-settings\integrations\amount-discount-visual-editor.tsx',
  'web\default\src\features\system-settings\integrations\amount-options-visual-editor.tsx'
)
foreach ($item in $items) {
  $fullPath = Join-Path $base $item
  if (Test-Path $fullPath) {
    $recycleBin.MoveHere($fullPath)
    Write-Host "Moved: $item"
  } else {
    Write-Host "Not found: $item"
  }
}
