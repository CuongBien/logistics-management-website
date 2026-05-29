import json

FILE_PATH = 'docs/postman/LMS_E2E_Collection.postman_collection.json'

with open(FILE_PATH, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Helper to find a folder recursively
def find_folder(items, name):
    for item in items:
        if name in item.get('name', ''):
            return item
        if 'item' in item:
            res = find_folder(item['item'], name)
            if res:
                return res
    return None

adv_scenarios = find_folder(data.get('item', []), 'Advanced Scenarios')
if not adv_scenarios:
    raise Exception("Advanced Scenarios folder not found!")

# Remove existing Case E if any
case_e_index = -1
for i, item in enumerate(adv_scenarios.get('item', [])):
    if 'Case E' in item.get('name', ''):
        case_e_index = i
        break

# Structure for 17 steps in Case E
steps = [
    # Leg 1: Can Tho Hub (WH-CT-001)
    {
        "name": "1. Create InboundRequest (Source CT, Dest HP)",
        "request": {
            "method": "POST",
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "body": {
                "mode": "raw",
                "raw": json.dumps({
                    "sourceWarehouseCode": "WH-CT-001",
                    "destinationWarehouseCode": "WH-CT-001",
                    "items": [{"skuCode": "SKU-BLUE-SHIRT", "quantity": 50}],
                    "note": "Cross-region consignment test: Can Tho to Hai Phong"
                }, indent=4)
            },
            "url": {
                "raw": "{{oms_url}}/api/Orders/inbound-request",
                "host": ["{{oms_url}}"],
                "path": ["api", "Orders", "inbound-request"]
            }
        },
        "event": [
            {
                "listen": "test",
                "script": {
                    "exec": [
                        "const response = pm.response.json();",
                        "pm.collectionVariables.set(\"orderId_E\", response.value || response.id);"
                    ],
                    "type": "javascript"
                }
            }
        ]
    },
    {
        "name": "2. GET Auto-Generated Inbound Receipt at Source (CT)",
        "request": {
            "method": "GET",
            "header": [],
            "url": {
                "raw": "{{wms_url}}/api/inbound/receipts/by-order/{{orderId_E}}",
                "host": ["{{wms_url}}"],
                "path": ["api", "inbound", "receipts", "by-order", "{{orderId_E}}"]
            }
        },
        "event": [
            {
                "listen": "prerequest",
                "script": {
                    "exec": ["setTimeout(function(){}, 2000);"],
                    "type": "javascript"
                }
            },
            {
                "listen": "test",
                "script": {
                    "exec": [
                        "const response = pm.response.json();",
                        "pm.collectionVariables.set(\"receiptId_E\", response.id || response.value.id);"
                    ],
                    "type": "javascript"
                }
            }
        ]
    },
    {
        "name": "3. Receive Package at Source (CT)",
        "request": {
            "method": "PUT",
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "body": {
                "mode": "raw",
                "raw": json.dumps({
                    "orderId": "{{orderId_E}}",
                    "skuCode": "SKU-BLUE-SHIRT",
                    "quantity": 50,
                    "binCode": "BIN-CT-001"
                }, indent=4)
            },
            "url": {
                "raw": "{{wms_url}}/api/inbound/receipts/{{receiptId_E}}/receive",
                "host": ["{{wms_url}}"],
                "path": ["api", "inbound", "receipts", "{{receiptId_E}}", "receive"]
            }
        }
    },
    {
        "name": "4. Sort Package for Line-haul (CT to HP)",
        "request": {
            "method": "PUT",
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "body": {
                "mode": "raw",
                "raw": json.dumps({
                    "orderId": "{{orderId_E}}",
                    "destinationWarehouseId": "f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f6f6"
                }, indent=4)
            },
            "url": {
                "raw": "{{wms_url}}/api/outbound/sort",
                "host": ["{{wms_url}}"],
                "path": ["api", "outbound", "sort"]
            }
        }
    },
    {
        "name": "5. GET Shipment ID at CT",
        "request": {
            "method": "GET",
            "header": [],
            "url": {
                "raw": "{{wms_url}}/api/outbound/orders/{{orderId_E}}/shipment",
                "host": ["{{wms_url}}"],
                "path": ["api", "outbound", "orders", "{{orderId_E}}", "shipment"]
            }
        },
        "event": [
            {
                "listen": "prerequest",
                "script": {
                    "exec": ["setTimeout(function(){}, 2000);"],
                    "type": "javascript"
                }
            },
            {
                "listen": "test",
                "script": {
                    "exec": [
                        "const response = pm.response.json();",
                        "pm.collectionVariables.set(\"shipmentId_Ch1_E\", response.shipmentId || response.value || response.id);"
                    ],
                    "type": "javascript"
                }
            }
        ]
    },
    {
        "name": "6. Dispatch Shipment at CT",
        "request": {
            "method": "POST",
            "header": [],
            "url": {
                "raw": "{{wms_url}}/api/outbound/shipments/{{shipmentId_Ch1_E}}/dispatch",
                "host": ["{{wms_url}}"],
                "path": ["api", "outbound", "shipments", "{{shipmentId_Ch1_E}}", "dispatch"]
            }
        }
    },
    # Leg 2: HCM Mega Hub (WH-SG-002)
    {
        "name": "7. Receive Transit Shipment at HCM",
        "request": {
            "method": "POST",
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "body": {
                "mode": "raw",
                "raw": json.dumps({
                    "warehouseId": "a3a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1",
                    "receivedItems": {"SKU-BLUE-SHIRT": 50}
                }, indent=4)
            },
            "url": {
                "raw": "{{wms_url}}/api/inbound/orders/{{orderId_E}}/transit-receive",
                "host": ["{{wms_url}}"],
                "path": ["api", "inbound", "orders", "{{orderId_E}}", "transit-receive"]
            }
        },
        "event": [
            {
                "listen": "prerequest",
                "script": {
                    "exec": ["setTimeout(function(){}, 2000);"],
                    "type": "javascript"
                }
            }
        ]
    },
    {
        "name": "8. Sort Package at HCM (HCM to HP)",
        "request": {
            "method": "PUT",
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "body": {
                "mode": "raw",
                "raw": json.dumps({
                    "orderId": "{{orderId_E}}",
                    "destinationWarehouseId": "f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f6f6"
                }, indent=4)
            },
            "url": {
                "raw": "{{wms_url}}/api/outbound/sort",
                "host": ["{{wms_url}}"],
                "path": ["api", "outbound", "sort"]
            }
        }
    },
    {
        "name": "9. GET Shipment ID at HCM",
        "request": {
            "method": "GET",
            "header": [],
            "url": {
                "raw": "{{wms_url}}/api/outbound/orders/{{orderId_E}}/shipment",
                "host": ["{{wms_url}}"],
                "path": ["api", "outbound", "orders", "{{orderId_E}}", "shipment"]
            }
        },
        "event": [
            {
                "listen": "prerequest",
                "script": {
                    "exec": ["setTimeout(function(){}, 2000);"],
                    "type": "javascript"
                }
            },
            {
                "listen": "test",
                "script": {
                    "exec": [
                        "const response = pm.response.json();",
                        "pm.collectionVariables.set(\"shipmentId_Ch2_E\", response.shipmentId || response.value || response.id);"
                    ],
                    "type": "javascript"
                }
            }
        ]
    },
    {
        "name": "10. Dispatch Shipment at HCM",
        "request": {
            "method": "POST",
            "header": [],
            "url": {
                "raw": "{{wms_url}}/api/outbound/shipments/{{shipmentId_Ch2_E}}/dispatch",
                "host": ["{{wms_url}}"],
                "path": ["api", "outbound", "shipments", "{{shipmentId_Ch2_E}}", "dispatch"]
            }
        }
    },
    # Leg 3: Hanoi Mega Hub (WH-HN-006)
    {
        "name": "11. Receive Transit Shipment at Hanoi",
        "request": {
            "method": "POST",
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "body": {
                "mode": "raw",
                "raw": json.dumps({
                    "warehouseId": "e5e5e5e5-e5e5-e5e5-e5e5-e5e5e5e5e5e5",
                    "receivedItems": {"SKU-BLUE-SHIRT": 50}
                }, indent=4)
            },
            "url": {
                "raw": "{{wms_url}}/api/inbound/orders/{{orderId_E}}/transit-receive",
                "host": ["{{wms_url}}"],
                "path": ["api", "inbound", "orders", "{{orderId_E}}", "transit-receive"]
            }
        },
        "event": [
            {
                "listen": "prerequest",
                "script": {
                    "exec": ["setTimeout(function(){}, 2000);"],
                    "type": "javascript"
                }
            }
        ]
    },
    {
        "name": "12. Sort Package at Hanoi (Hanoi to HP)",
        "request": {
            "method": "PUT",
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "body": {
                "mode": "raw",
                "raw": json.dumps({
                    "orderId": "{{orderId_E}}",
                    "destinationWarehouseId": "f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f6f6"
                }, indent=4)
            },
            "url": {
                "raw": "{{wms_url}}/api/outbound/sort",
                "host": ["{{wms_url}}"],
                "path": ["api", "outbound", "sort"]
            }
        }
    },
    {
        "name": "13. GET Shipment ID at Hanoi",
        "request": {
            "method": "GET",
            "header": [],
            "url": {
                "raw": "{{wms_url}}/api/outbound/orders/{{orderId_E}}/shipment",
                "host": ["{{wms_url}}"],
                "path": ["api", "outbound", "orders", "{{orderId_E}}", "shipment"]
            }
        },
        "event": [
            {
                "listen": "prerequest",
                "script": {
                    "exec": ["setTimeout(function(){}, 2000);"],
                    "type": "javascript"
                }
            },
            {
                "listen": "test",
                "script": {
                    "exec": [
                        "const response = pm.response.json();",
                        "pm.collectionVariables.set(\"shipmentId_Ch3_E\", response.shipmentId || response.value || response.id);"
                    ],
                    "type": "javascript"
                }
            }
        ]
    },
    {
        "name": "14. Dispatch Shipment at Hanoi",
        "request": {
            "method": "POST",
            "header": [],
            "url": {
                "raw": "{{wms_url}}/api/outbound/shipments/{{shipmentId_Ch3_E}}/dispatch",
                "host": ["{{wms_url}}"],
                "path": ["api", "outbound", "shipments", "{{shipmentId_Ch3_E}}", "dispatch"]
            }
        }
    },
    # Leg 4: HP Hub (WH-HP-007)
    {
        "name": "15. Receive Transit Shipment at HP (Final)",
        "request": {
            "method": "POST",
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "body": {
                "mode": "raw",
                "raw": json.dumps({
                    "warehouseId": "f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f6f6",
                    "receivedItems": {"SKU-BLUE-SHIRT": 50}
                }, indent=4)
            },
            "url": {
                "raw": "{{wms_url}}/api/inbound/orders/{{orderId_E}}/transit-receive",
                "host": ["{{wms_url}}"],
                "path": ["api", "inbound", "orders", "{{orderId_E}}", "transit-receive"]
            }
        },
        "event": [
            {
                "listen": "prerequest",
                "script": {
                    "exec": ["setTimeout(function(){}, 2000);"],
                    "type": "javascript"
                }
            }
        ]
    },
    {
        "name": "16. GET Bins Hierarchy at HP (Extract Bin IDs)",
        "request": {
            "method": "GET",
            "header": [],
            "url": {
                "raw": "{{wms_url}}/api/Warehouse/f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f6f6/hierarchy",
                "host": ["{{wms_url}}"],
                "path": ["api", "Warehouse", "f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f6f6", "hierarchy"]
            }
        },
        "event": [
            {
                "listen": "test",
                "script": {
                    "exec": [
                        "const response = pm.response.json();",
                        "const hierarchy = response.value || response;",
                        "let sourceBinId = null;",
                        "let destBinId = null;",
                        "if (hierarchy && hierarchy.blocks) {",
                        "    for (const block of hierarchy.blocks) {",
                        "        if (block.zones) {",
                        "            for (const zone of block.zones) {",
                        "                if (zone.bins) {",
                        "                    for (const bin of zone.bins) {",
                        "                        if (bin.binCode === \"BIN-A1-01\") {",
                        "                            sourceBinId = bin.id;",
                        "                        }",
                        "                        if (bin.binCode === \"BIN-A1-02\") {",
                        "                            destBinId = bin.id;",
                        "                        }",
                        "                    }",
                        "                }",
                        "            }",
                        "        }",
                        "    }",
                        "}",
                        "pm.test(\"Bins found in hierarchy\", function () {",
                        "    pm.expect(sourceBinId).to.not.be.null;",
                        "    pm.expect(destBinId).to.not.be.null;",
                        "});",
                        "pm.collectionVariables.set(\"sourceBinId_E\", sourceBinId);",
                        "pm.collectionVariables.set(\"destBinId_E\", destBinId);"
                    ],
                    "type": "javascript"
                }
            }
        ]
    },
    {
        "name": "17. Putaway (Transfer) from Transit Bin to Storage Bin at HP",
        "request": {
            "method": "POST",
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "body": {
                "mode": "raw",
                "raw": json.dumps({
                    "warehouseId": "f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f6f6",
                    "sku": "SKU-BLUE-SHIRT",
                    "sourceBinId": "{{sourceBinId_E}}",
                    "destinationBinId": "{{destBinId_E}}",
                    "quantity": 50
                }, indent=4)
            },
            "url": {
                "raw": "{{wms_url}}/api/inventory/transfer",
                "host": ["{{wms_url}}"],
                "path": ["api", "inventory", "transfer"]
            }
        }
    }
]

case_e = {
    "name": "Case E: Cross-region Consignment (Line-haul + Fulfillment)",
    "item": steps
}

if case_e_index != -1:
    adv_scenarios['item'][case_e_index] = case_e
else:
    adv_scenarios['item'].append(case_e)

with open(FILE_PATH, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=4, ensure_ascii=False)

print("Rebuilt Case E folder with 17 true smart routing multi-hop steps successfully!")
