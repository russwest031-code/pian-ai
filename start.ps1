$ErrorActionPreference = "Stop"
$project = Split-Path -Parent $MyInvocation.MyCommand.Path
$bundledNode = "C:\Users\Russell\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
$node = Get-Command node -ErrorAction SilentlyContinue
if ($node) { $nodePath = $node.Source }
elseif (Test-Path $bundledNode) { $nodePath = $bundledNode }
else { throw "未找到 Node.js，请先安装 Node.js 18 或更高版本。" }

if (-not (Test-Path (Join-Path $project ".env"))) {
  Copy-Item (Join-Path $project ".env.example") (Join-Path $project ".env")
  Write-Host "已创建 .env。请先填写 TMDB_READ_TOKEN，再重新运行本脚本。" -ForegroundColor Yellow
  exit 1
}

Start-Process "http://127.0.0.1:4173"
& $nodePath (Join-Path $project "server.js")
