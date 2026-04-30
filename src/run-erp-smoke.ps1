param(
    [string]$ComposeFile = "deploy/docker/docker-compose.local.yml"
)

$ErrorActionPreference = "Stop"

Write-Host "[1/6] Start mock ERP..."
$mockJob = Start-Process powershell -PassThru -WindowStyle Hidden -ArgumentList @(
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    "tests/mock-erp/mock-erp.ps1"
)
Start-Sleep -Seconds 2

try {
    Write-Host "[2/6] Build and start docker services..."
    docker compose -f $ComposeFile up -d --build | Out-Host

    Write-Host "[3/6] Wait for API startup..."
    Start-Sleep -Seconds 10

    Write-Host "[4/6] Verify mock ERP endpoint..."
    curl.exe --silent --show-error -H "X-API-Key: dev-key" "http://localhost:5009/api/skus?tenant_id=default-tenant&updated_after=cursor-0&limit=100" | Out-Host

    Write-Host "[5/6] Tail ERP sync logs..."
    docker logs --tail 60 lms-ordering-api | Out-Host
    docker logs --tail 60 lms-warehouse-api | Out-Host

    Write-Host "[6/6] Smoke run completed."
}
finally {
    if (!$mockJob.HasExited) {
        Stop-Process -Id $mockJob.Id -Force
    }
}
