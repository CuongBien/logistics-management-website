$slnPath = "d:\Logistics\src\LMS.sln"
if (Test-Path $slnPath) {
    (Get-Content $slnPath) -replace "OMS", "Ordering" -replace "WMS", "Warehouse" -replace "Gateway.Api", "Web.Bff.Logistics.Api" -replace "BuildingBlocks.Domain", "Logistics.Core" -replace "BuildingBlocks.Messaging", "EventBus.Messages" | Set-Content $slnPath
}

$filesToUpdate = Get-ChildItem -Path "d:\Logistics\src" -Recurse -Include *.cs, *.csproj, *.json
foreach ($file in $filesToUpdate) {
    # Skip binary files if any slipped through
    $c = Get-Content $file.FullName
    $c = $c -replace "OMS\.", "Ordering." -replace "WMS\.", "Warehouse." -replace "BuildingBlocks\.Domain", "Logistics.Core" -replace "BuildingBlocks\.Messaging", "EventBus.Messages" -replace "Gateway\.Api", "Web.Bff.Logistics.Api"
    Set-Content $file.FullName $c
}

# Delete obj and bin folders to prevent build locks
Get-ChildItem -Path "d:\Logistics\src" -Include bin,obj -Recurse -Directory | Remove-Item -Force -Recurse

# Rename inner folders
$folderPairs = @{
    "d:\Logistics\src\Services\Ordering\OMS.Api" = "Ordering.Api";
    "d:\Logistics\src\Services\Ordering\OMS.Application" = "Ordering.Application";
    "d:\Logistics\src\Services\Ordering\OMS.Domain" = "Ordering.Domain";
    "d:\Logistics\src\Services\Ordering\OMS.Infrastructure" = "Ordering.Infrastructure";
    "d:\Logistics\src\Services\Warehouse\WMS.Api" = "Warehouse.Api";
    "d:\Logistics\src\Services\Warehouse\WMS.Application" = "Warehouse.Application";
    "d:\Logistics\src\Services\Warehouse\WMS.Domain" = "Warehouse.Domain";
    "d:\Logistics\src\Services\Warehouse\WMS.Infrastructure" = "Warehouse.Infrastructure";
    "d:\Logistics\src\ApiGateways\Web.Bff.Logistics\Gateway.Api" = "Web.Bff.Logistics.Api"
}

foreach ($key in $folderPairs.Keys) {
    if (Test-Path $key) { Rename-Item $key $folderPairs[$key] }
}

# Rename CSPROJ files
Get-ChildItem -Path "d:\Logistics\src\Services\Ordering" -Recurse -Filter "OMS.*.csproj" | Rename-Item -NewName {$_.Name -replace 'OMS', 'Ordering'}
Get-ChildItem -Path "d:\Logistics\src\Services\Warehouse" -Recurse -Filter "WMS.*.csproj" | Rename-Item -NewName {$_.Name -replace 'WMS', 'Warehouse'}
Get-ChildItem -Path "d:\Logistics\src\ApiGateways\Web.Bff.Logistics" -Recurse -Filter "Gateway.Api.csproj" | Rename-Item -NewName "Web.Bff.Logistics.Api.csproj"
Get-ChildItem -Path "d:\Logistics\src\BuildingBlocks" -Recurse -Filter "BuildingBlocks.Domain.csproj" | Rename-Item -NewName "Logistics.Core.csproj"
Get-ChildItem -Path "d:\Logistics\src\BuildingBlocks" -Recurse -Filter "BuildingBlocks.Messaging.csproj" | Rename-Item -NewName "EventBus.Messages.csproj"
