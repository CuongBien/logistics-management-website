$body = @{ 
    grant_type = "password"
    client_id = "oms-client"
    username = "tester01"
    password = "123456"
}

$token = Invoke-RestMethod -Method POST `
    -Uri "http://localhost:18080/realms/logistics_realm/protocol/openid-connect/token" `
    -ContentType "application/x-www-form-urlencoded" `
    -Body $body

Write-Host "Token obtained"

$invBody = @{
    sku = "SKU-TEST-002"
    quantity = 50
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Method POST `
        -Uri "http://localhost:5051/api/inventory" `
        -Headers @{ Authorization = "Bearer $($token.access_token)" } `
        -ContentType "application/json" `
        -Body $invBody `
        -ErrorAction Stop
    
    Write-Host "Success: $response"
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    
    $webException = $_.Exception.GetBaseException()
    if ($webException -is [System.Net.WebException]) {
        $response = $webException.Response
        if ($response) {
            $stream = $response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $body = $reader.ReadToEnd()
            Write-Host "Response Body: $body"
        }
    }
}
