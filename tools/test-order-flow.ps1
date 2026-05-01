param(
    [switch]$SkipSignalR
)

$ErrorActionPreference = "Stop"
$baseUrl = "http://localhost:5000"

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Order State Transitions + SignalR Test" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

# Step 1: Get JWT Token
Write-Host "`n[1/7] Getting JWT token..." -ForegroundColor Yellow

$body = @{
    grant_type = "password"
    client_id = "oms-client"
    username = "tester01"
    password = "123456"
}

$tokenResponse = Invoke-RestMethod -Method POST `
    -Uri "http://localhost:18080/realms/logistics_realm/protocol/openid-connect/token" `
    -ContentType "application/x-www-form-urlencoded" `
    -Body $body

$token = $tokenResponse.access_token
Write-Host "Token obtained: $($token.Substring(0, 50))..." -ForegroundColor Green

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# Step 2: Create Order
Write-Host "`n[2/7] Creating order..." -ForegroundColor Yellow

$createOrderBody = @{
    consignorId = "user-123"
    consignee = @{
        fullName = "Tran Van B"
        phone = "0912345678"
        address = @{
            street = "456 Le Van Viet, Q9"
            city = "Ho Chi Minh"
            state = "HCM"
            country = "Vietnam"
            zipCode = "70000"
        }
    }
    codAmount = 500000
    shippingFee = 25000
    weight = 2.5
    note = "Fragile items"
} | ConvertTo-Json

$createResult = Invoke-RestMethod -Method POST `
    -Uri "$baseUrl/api/orders" `
    -Headers $headers `
    -Body $createOrderBody

if ($createResult.isSuccess -ne $true) {
    Write-Host "Create order failed: $($createResult.error.message)" -ForegroundColor Red
    exit 1
}

$orderId = $createResult.value
Write-Host "Order created: $orderId" -ForegroundColor Green

# Step 3: Get Order Status
Write-Host "`n[3/7] Getting order details..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

$order = Invoke-RestMethod -Method GET `
    -Uri "$baseUrl/api/orders/$orderId" `
    -Headers $headers

Write-Host "Order Status: $($order.value.status)" -ForegroundColor Cyan

# Step 4: Pickup
Write-Host "`n[4/7] Testing Pickup..." -ForegroundColor Yellow
Start-Sleep -Seconds 1

$pickupBody = @{
    driverId = "driver-001"
} | ConvertTo-Json

$pickupResult = Invoke-RestMethod -Method PUT `
    -Uri "$baseUrl/api/orders/$orderId/actions/pickup" `
    -Headers $headers `
    -Body $pickupBody

if ($pickupResult.isSuccess) {
    Write-Host "Pickup SUCCESS - Status: $($pickupResult.value)" -ForegroundColor Green
} else {
    Write-Host "Pickup FAILED: $($pickupResult.error.message)" -ForegroundColor Red
}

# Step 5: Receive (Warehouse)
Write-Host "`n[5/7] Testing Receive..." -ForegroundColor Yellow
Start-Sleep -Seconds 1

$receiveBody = @{
    warehouseId = "WH-HCM-001"
    receivedBy = "warehouse-worker-01"
} | ConvertTo-Json

$receiveResult = Invoke-RestMethod -Method PUT `
    -Uri "$baseUrl/api/orders/$orderId/actions/receive" `
    -Headers $headers `
    -Body $receiveBody

if ($receiveResult.isSuccess) {
    Write-Host "Receive SUCCESS - Status: $($receiveResult.value)" -ForegroundColor Green
} else {
    Write-Host "Receive FAILED: $($receiveResult.error.message)" -ForegroundColor Red
}

# Step 6: Sort
Write-Host "`n[6/7] Testing Sort..." -ForegroundColor Yellow
Start-Sleep -Seconds 1

$sortBody = @{
    destinationHubId = "HUB-Q9-001"
} | ConvertTo-Json

$sortResult = Invoke-RestMethod -Method PUT `
    -Uri "$baseUrl/api/orders/$orderId/actions/sort" `
    -Headers $headers `
    -Body $sortBody

if ($sortResult.isSuccess) {
    Write-Host "Sort SUCCESS - Status: $($sortResult.value)" -ForegroundColor Green
} else {
    Write-Host "Sort FAILED: $($sortResult.error.message)" -ForegroundColor Red
}

# Step 7: Dispatch
Write-Host "`n[7/7] Testing Dispatch..." -ForegroundColor Yellow
Start-Sleep -Seconds 1

$dispatchBody = @{
    driverId = "delivery-driver-42"
    routeId = "ROUTE-Q9-001"
} | ConvertTo-Json

$dispatchResult = Invoke-RestMethod -Method PUT `
    -Uri "$baseUrl/api/orders/$orderId/actions/dispatch" `
    -Headers $headers `
    -Body $dispatchBody

if ($dispatchResult.isSuccess) {
    Write-Host "Dispatch SUCCESS - Status: $($dispatchResult.value)" -ForegroundColor Green
} else {
    Write-Host "Dispatch FAILED: $($dispatchResult.error.message)" -ForegroundColor Red
}

# Final Order Status
Write-Host "`n======================================" -ForegroundColor Cyan
Write-Host "Final Order Status" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

Start-Sleep -Seconds 2
$finalOrder = Invoke-RestMethod -Method GET `
    -Uri "$baseUrl/api/orders/$orderId" `
    -Headers $headers

Write-Host "Order ID: $orderId"
Write-Host "Status: $($finalOrder.value.status)"
Write-Host "Pickup Driver: $($finalOrder.value.pickupDriverId)"
Write-Host "Delivery Driver: $($finalOrder.value.deliveryDriverId)"
Write-Host "Created: $($finalOrder.value.createdAt)"
Write-Host "Updated: $($finalOrder.value.updatedAt)"

# SignalR Test
if (-not $SkipSignalR) {
    Write-Host "`n======================================" -ForegroundColor Cyan
    Write-Host "SignalR Real-time Test" -ForegroundColor Cyan
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host "Open this file in browser to test SignalR:" -ForegroundColor Yellow
    Write-Host "tools\test-signalr.html" -ForegroundColor White
    Write-Host "`nInstructions:" -ForegroundColor Yellow
    Write-Host "1. Copy the token: `$token.access_token | clip" -ForegroundColor White
    Write-Host "2. Open test-signalr.html in browser" -ForegroundColor White
    Write-Host "3. Paste token and click Connect" -ForegroundColor White
    Write-Host "4. Create a new order to see notifications!" -ForegroundColor White
}

Write-Host "`n======================================" -ForegroundColor Cyan
Write-Host "Test Complete!" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
