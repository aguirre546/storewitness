param([switch]$Install)
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
if (-not (Test-Path -LiteralPath '.venv/Scripts/python.exe')) {
    py -3 -m venv .venv
    if ($LASTEXITCODE -ne 0) { throw 'Install Python 3.11 or later from python.org, then retry.' }
    $Install = $true
}
if ($Install) {
    & '.venv/Scripts/python.exe' -m pip install -r requirements.txt
    if ($LASTEXITCODE -ne 0) { throw 'Dependency installation failed. Check internet and retry -Install.' }
}
Write-Host 'Open http://127.0.0.1:4332 in your browser. Keep this terminal running.'
& '.venv/Scripts/python.exe' app.py
