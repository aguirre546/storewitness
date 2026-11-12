$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
$env:STOREWITNESS_PERSIST = '1'
Write-Host 'StoreWitness local demo: http://127.0.0.1:4330'
Write-Host 'Keep this terminal open. Press Ctrl+C to stop. Local records are kept in data/.'
node preview.mjs
