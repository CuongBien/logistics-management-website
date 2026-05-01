# LMS API Test Script
# Usage: powershell -ExecutionPolicy Bypass -File tools/test-api.ps1

Write-Host "=== LMS API Test Script ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Get Token
Write-Host "Step 1: Getting JWT Token..." -ForegroundColor Yellow

$body = @{
    grant_type = "password"
    client_id = "oms-client"
    username = "tester01"
    password = "123456"
}

try {
    $tokenResponse = Invoke-RestMethod -Method POST `
        -Uri "http://localhost:18080/realms/logistics_realm/protocol/openid-connect/token" `
        -ContentType "application/x-www-form-urlencoded" `
        -Body $body
    
    $token = $tokenResponse.access_token
    Write-Host "Token obtained successfully!" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to get token. Check credentials." -ForegroundColor Red
    Write-Host $_.Exception.Message
    exit 1
}

# Step 2: Create Order
Write-Host ""
Write-Host "Step 2: Creating Order..." -ForegroundColor Yellow

$headers = @{
    Authorization = "Bearer $token"
}

$orderBody = @{
    consignorId = "tester01"
    consignee = @{
        fullName = "Test User"
        phone = "0909123456"
        address = @{
            street = "123 Test St"
            city = "Ho Chi Minh"
            state = "District 5"
            country = "Vietnam"
            zipCode = "700000"
        }
    }
    codAmount = 100000
    shippingFee = 30000
    weight = 2.5
} | ConvertTo-Json -Depth 5

try {
    $orderResponse = Invoke-RestMethod -Method POST `
        -Uri "http://localhost:5000/api/orders" `
        -Headers $headers `
        -ContentType "application/json" `
        -Body $orderBody
    
    Write-Host "Order created successfully!" -ForegroundColor Green
    $orderResponse | ConvertTo-Json | Write-Host
    
    $orderId = $orderResponse.value
} catch {
    Write-Host "ERROR: Failed to create order." -ForegroundColor Red
    Write-Host $_.Exception.Message
    exit 1
}

# Step 3: Get Order Details
if ($orderId) {
    Write-Host ""
    Write-Host "Step 3: Getting Order Details..." -ForegroundColor Yellow
    
    Start-Sleep -Seconds 1
    
    try {
        $order = Invoke-RestMethod -Method GET `
            -Uri "http://localhost:5000/api/orders/$orderId" `
            -Headers $headers
        
        Write-Host "Order retrieved successfully!" -ForegroundColor Green
        $order | ConvertTo-Json -Depth 5 | Write-Host
    } catch {
        Write-Host "WARNING: Failed to get order details." -ForegroundColor Yellow
        Write-Host $_.Exception.Message
    }
}

# Step 4: Create Inventory Item
Write-Host ""
Write-Host "Step 4: Creating Inventory Item..." -ForegroundColor Yellow

$invBody = @{
    sku = "SKU-TEST-$(Get-Random -Maximum 9999)"
    quantity = 100
} | ConvertTo-Json

Write-Host "Request body: $invBody" -ForegroundColor Gray

try {
    $invResponse = Invoke-RestMethod -Method POST `
        -Uri "http://localhost:5051/api/inventory" `
        -Headers $headers `
        -ContentType "application/json" `
        -Body $invBody `
        -ErrorAction Stop
    
    Write-Host "Inventory item created successfully!" -ForegroundColor Green
    $invResponse | ConvertTo-Json | Write-Host
} catch {
    Write-Host "WARNING: Failed to create inventory item." -ForegroundColor Yellow
    Write-Host $_.Exception.Message
    
    $webEx = $_.Exception.GetBaseException()
    if ($webEx.Response) {
        $stream = $webEx.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $respBody = $reader.ReadToEnd()
        Write-Host "Response: $respBody" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "=== Test Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Check these UIs for more details:" -ForegroundColor White
Write-Host "  - Jaeger: http://localhost:16686" -ForegroundColor White
Write-Host "  - Seq: http://localhost:8081" -ForegroundColor White
Write-Host "  - RabbitMQ: http://localhost:15672" -ForegroundColor White
