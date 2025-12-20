$ErrorActionPreference = 'Stop'
$root = "C:/Users/phill/Documents/HB_Racing_7/cam-spec-elite"
Set-Location $root
$job = Start-Job -ScriptBlock {
    param($path)
    Set-Location $path
    npm run dev -- --hostname 127.0.0.1 --port 4000
} -ArgumentList $root
Start-Sleep -Seconds 5
$family = [uri]::EscapeDataString('Small Block Windsor (221/260/289/302/351W)')
$url = "http://127.0.0.1:4000/api/cams/search?make=Ford&family=$family"
$response = Invoke-WebRequest -Uri $url -UseBasicParsing
"API Status: $($response.StatusCode)" | Write-Output
$response.Content | Write-Output
Stop-Job $job
Receive-Job $job | Out-String | Write-Output
