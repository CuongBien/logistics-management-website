param(
    [int]$Port = 5009,
    [string]$ApiKey = "dev-key"
)

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://*:$Port/")
$listener.Start()

Write-Host "Mock ERP server started at http://localhost:$Port"
Write-Host "Expected API key: $ApiKey"

$skuItems = @(
    @{
        erpSkuId = "ERP-SKU-001"
        skuCode = "SKU-RED-TSHIRT"
        name = "Red T-Shirt"
        unitOfMeasure = "PCS"
        status = "active"
        updatedAtErp = "2026-04-30T00:00:00Z"
    },
    @{
        erpSkuId = "ERP-SKU-002"
        skuCode = "SKU-BLUE-JEANS"
        name = "Blue Jeans"
        unitOfMeasure = "PCS"
        status = "active"
        updatedAtErp = "2026-04-30T00:05:00Z"
    },
    @{
        erpSkuId = "ERP-SKU-003"
        skuCode = "SKU-AO-001"
        name = "Áo sơ mi nam"
        unitOfMeasure = "PCS"
        status = "active"
        updatedAtErp = "2026-04-30T00:10:00Z"
    }
)

$warehouseItems = @(
    @{
        erpWarehouseId = "ERP-WH-001"
        warehouseCode = "HCM-HUB-01"
        name = "Ho Chi Minh Hub 01"
        status = "active"
        updatedAtErp = "2026-04-30T00:00:00Z"
    },
    @{
        erpWarehouseId = "ERP-WH-002"
        warehouseCode = "HN-HUB-01"
        name = "Ha Noi Hub 01"
        status = "active"
        updatedAtErp = "2026-04-30T00:05:00Z"
    },
    @{
        erpWarehouseId = "ERP-WH-003"
        warehouseCode = "WH-CT-001"
        name = "Can Tho Hub 01"
        status = "active"
        updatedAtErp = "2026-04-30T00:10:00Z"
    },
    @{
        erpWarehouseId = "ERP-WH-004"
        warehouseCode = "WH-SG-002"
        name = "HCM Mega Hub 02"
        status = "active"
        updatedAtErp = "2026-04-30T00:10:00Z"
    },
    @{
        erpWarehouseId = "ERP-WH-005"
        warehouseCode = "WH-HN-006"
        name = "Hanoi Hub 06"
        status = "active"
        updatedAtErp = "2026-04-30T00:10:00Z"
    },
    @{
        erpWarehouseId = "ERP-WH-006"
        warehouseCode = "WH-HP-007"
        name = "Hai Phong Hub 07"
        status = "active"
        updatedAtErp = "2026-04-30T00:10:00Z"
    }
)

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()

        try {
            $request = $context.Request
            $response = $context.Response
            $path = $request.Url.AbsolutePath.TrimEnd("/")
            $apiKeyHeader = $request.Headers["X-API-Key"]

            if ($apiKeyHeader -ne $ApiKey) {
                $response.StatusCode = 401
                $buffer = [System.Text.Encoding]::UTF8.GetBytes('{"error":"Unauthorized API key"}')
                $response.OutputStream.Write($buffer, 0, $buffer.Length)
                $response.OutputStream.Close()
                continue
            }

            $nextCursor = $request.QueryString["updated_after"]
            if ([string]::IsNullOrWhiteSpace($nextCursor)) {
                $nextCursor = "cursor-1"
            }

            $payload = $null
            switch ($path) {
                "/skus" {
                    $payload = @{
                        items = $skuItems
                        nextCursor = $nextCursor
                    }
                }
                "/api/skus" {
                    $payload = @{
                        items = $skuItems
                        nextCursor = $nextCursor
                    }
                }
                "/warehouses" {
                    $payload = @{
                        items = $warehouseItems
                        nextCursor = $nextCursor
                    }
                }
                "/api/warehouses" {
                    $payload = @{
                        items = $warehouseItems
                        nextCursor = $nextCursor
                    }
                }
                default {
                    $response.StatusCode = 404
                    $buffer = [System.Text.Encoding]::UTF8.GetBytes('{"error":"Not found"}')
                    $response.OutputStream.Write($buffer, 0, $buffer.Length)
                    $response.OutputStream.Close()
                    continue
                }
            }

            $json = $payload | ConvertTo-Json -Depth 5
            if ([string]::IsNullOrWhiteSpace($json)) {
                throw "Mock ERP serialization produced empty JSON for path '$path'."
            }

            $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
            $response.ContentType = "application/json"
            $response.StatusCode = 200
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.OutputStream.Close()
        }
        catch {
            Write-Host "Mock ERP request error: $($_.Exception.Message)"
            try {
                $errResponse = $context.Response
                $errResponse.StatusCode = 500
                $errBytes = [System.Text.Encoding]::UTF8.GetBytes('{"error":"Mock ERP internal error"}')
                $errResponse.OutputStream.Write($errBytes, 0, $errBytes.Length)
                $errResponse.OutputStream.Close()
            }
            catch {
                # ignore secondary response write failures
            }
        }
    }
}
finally {
    $listener.Stop()
    $listener.Close()
    Write-Host "Mock ERP server stopped."
}
