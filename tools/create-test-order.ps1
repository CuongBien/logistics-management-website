$body = @{grant_type='password';client_id='oms-client';username='tester01';password='123456'}
$token = Invoke-RestMethod -Uri 'http://localhost:18080/realms/logistics_realm/protocol/openid-connect/token' -ContentType 'application/x-www-form-urlencoded' -Body $body

$h = @{
    'Authorization' = "Bearer $($token.access_token)"
    'Content-Type' = 'application/json'
}

$order = @{
    consignorId = 'user-123'
    consignee = @{
        fullName = 'Test User'
        phone = '0909123456'
        address = @{
            street = '123 Test St'
            city = 'Ho Chi Minh'
            state = 'HCM'
            country = 'Vietnam'
            zipCode = '70000'
        }
    }
    codAmount = 100000
    shippingFee = 25000
    weight = 1.5
    note = 'SignalR test'
} | ConvertTo-Json

Write-Host "Creating order..." -ForegroundColor Yellow
$r = Invoke-RestMethod -Method POST -Uri 'http://localhost:5000/api/orders' -Headers $h -Body $order

if ($r.isSuccess) {
    Write-Host "Order created: $($r.value)" -ForegroundColor Green
    Write-Host "`nCheck the SignalR test page for notification!" -ForegroundColor Cyan
} else {
    Write-Host "Error: $($r.error.message)" -ForegroundColor Red
}
