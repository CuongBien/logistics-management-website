import json

FILE_PATH = 'docs/postman/LMS_E2E_Collection.postman_collection.json'

with open(FILE_PATH, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Find 'Advanced Scenarios' or root
def get_folder(items, name):
    for item in items:
        if name in item.get('name', ''):
            return item
        if 'item' in item:
            res = get_folder(item['item'], name)
            if res: return res
    return None

adv_scenarios = get_folder(data.get('item', []), 'Advanced Scenarios')
if not adv_scenarios:
    adv_scenarios = {
        "name": "Advanced Scenarios",
        "item": []
    }
    data['item'].append(adv_scenarios)

# Create Case E: Cross-region Consignment
case_e = {
    "name": "Case E: Cross-region Consignment (Line-haul + Fulfillment)",
    "item": []
}

case_e['item'].extend([
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
                    "note": "Cross-region consignment test"
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
                        "pm.collectionVariables.set(\"orderId_E\", response.value);"
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
                        "pm.collectionVariables.set(\"receiptId_E\", response.id);"
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
            "method": "POST",
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "body": {
                "mode": "raw",
                "raw": json.dumps({
                    "orderId": "{{orderId_E}}",
                    "destinationWarehouseId": "c72b9072-6349-4b29-911c-446dd304f136"
                }, indent=4)
            },
            "url": {
                "raw": "{{wms_url}}/api/outbound/orders/sort",
                "host": ["{{wms_url}}"],
                "path": ["api", "outbound", "orders", "sort"]
            }
        }
    }
])

adv_scenarios['item'].append(case_e)

with open(FILE_PATH, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=4, ensure_ascii=False)

print("Added Case E to Postman collection.")
