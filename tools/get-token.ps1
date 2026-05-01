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

$token.access_token | clip
Write-Host "Token copied to clipboard!"
