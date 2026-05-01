# Create a test order to trigger SignalR notification

$token = Invoke-RestMethod -Method POST -Uri 'http://localhost:18080/realms/logistics_realm/protocol/openid-connect/token' -ContentType 'application/x-www-form-urlencoded' -Body 'grant_type=password&client_id=oms-client&username=tester01&password=123456'

$headers = @{
    'Authorization' = "Bearer $($token.access_token)"
    'Content-Type' = 'application/json'
}

$orderBody = @{
    consignorId = 'user-signalr-test'
    consignee = @{
        fullName = 'SignalR Test User'
        phone = '0909123456'
        address = @{
            street = '456 Test Ave'
            city = 'Ho Chi Minh'
            state = 'HCM'
            country = 'Vietnam'
            zipCode = '70000'
        }
    }
    codAmount = 150000
    shippingFee = 30000
    weight = 2.0
    note = 'SignalR notification test'
} | ConvertTo-Json

Write-Host "Creating order to trigger SignalR notification..." -ForegroundColor Cyan
$result = Invoke-RestMethod -Method POST -Uri 'http://localhost:5000/api/orders' -Headers $headers -Body $orderBody

if ($result.isSuccess) {
    Write-Host "Order created: $($result.value)" -ForegroundColor Green
    Write-Host "Check your SignalR test page for the notification!" -ForegroundColor Yellow
} else {
    Write-Host "Error: $($result.error.message)" -ForegroundColor Red
}
