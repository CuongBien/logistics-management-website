import json
import time

FILE_PATH = 'docs/postman/LMS_E2E_Collection.postman_collection.json'

with open(FILE_PATH, 'r', encoding='utf-8') as f:
    data = json.load(f)

def find_case_d(items):
    for item in items:
        if 'Case D' in item.get('name', ''):
            return item
        if 'item' in item:
            res = find_case_d(item['item'])
            if res: return res
    return None

case_d = find_case_d(data.get('item', []))
if not case_d:
    print("Case D not found")
    exit(1)

# Extract original steps
steps = case_d['item']

# Save old Step 1 (Create Warehouse Order A) to reuse its body later
old_step_1 = next(s for s in steps if '1. Create Warehouse Order A' in s['name'])
old_step_1_body = json.loads(old_step_1['request']['body']['raw'])
old_step_1_body['fulfillmentMode'] = 2 # ADD FULFILLMENT MODE 2

# We need to build the new sequence for Order A (Steps 1 to 9)
new_steps = []

# Step 0
new_steps.append(steps[0])

# Step 1: Create InboundRequest A (OMS)
new_steps.append({
    "name": "1. Create InboundRequest A (OMS)",
    "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
            "mode": "raw",
            "raw": json.dumps({
                "destinationWarehouseCode": "WH-CT-001",
                "items": [{"skuCode": "SKU-RED-TSHIRT", "quantity": 150}],
                "note": "Seed inventory for Case D Order A"
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
                    "pm.collectionVariables.set(\"orderId_D_A_Seed\", response.value);"
                ],
                "type": "javascript"
            }
        }
    ]
})

# Step 2: GET Auto-Generated Inbound Receipt A (WMS)
new_steps.append({
    "name": "2. GET Auto-Generated Inbound Receipt A (WMS)",
    "request": {
        "method": "GET",
        "header": [],
        "url": {
            "raw": "{{wms_url}}/api/inbound/receipts/by-order/{{orderId_D_A_Seed}}",
            "host": ["{{wms_url}}"],
            "path": ["api", "inbound", "receipts", "by-order", "{{orderId_D_A_Seed}}"]
        }
    },
    "event": [
        {
            "listen": "prerequest",
            "script": {
                "exec": ["setTimeout(function(){}, 2000); // Wait 2s for RabbitMQ"],
                "type": "javascript"
            }
        },
        {
            "listen": "test",
            "script": {
                "exec": [
                    "const response = pm.response.json();",
                    "pm.collectionVariables.set(\"receiptId_4\", response.id);"
                ],
                "type": "javascript"
            }
        }
    ]
})

# Step 3: Scan & Receive Package A into Bin (WMS)
new_steps.append({
    "name": "3. Scan & Receive Package A into Bin (WMS)",
    "request": {
        "method": "PUT",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
            "mode": "raw",
            "raw": json.dumps({
                "orderId": "{{orderId_D_A_Seed}}",
                "skuCode": "SKU-RED-TSHIRT",
                "quantity": 150,
                "binCode": "BIN-CT-001"
            }, indent=4)
        },
        "url": {
            "raw": "{{wms_url}}/api/inbound/receipts/{{receiptId_4}}/receive",
            "host": ["{{wms_url}}"],
            "path": ["api", "inbound", "receipts", "{{receiptId_4}}", "receive"]
        }
    }
})

# Step 4: Create Warehouse Order A (OMS)
old_step_1['name'] = "4. Create Warehouse Order A (OMS)"
old_step_1['request']['body']['raw'] = json.dumps(old_step_1_body, indent=4)
new_steps.append(old_step_1)

# Step 5: GET Auto-Generated Outbound Order A (WMS)
new_steps.append({
    "name": "5. GET Auto-Generated Outbound Order A (WMS)",
    "request": {
        "method": "GET",
        "header": [],
        "url": {
            "raw": "{{wms_url}}/api/outbound/orders/{{orderId_D_A}}",
            "host": ["{{wms_url}}"],
            "path": ["api", "outbound", "orders", "{{orderId_D_A}}"]
        }
    },
    "event": [
        {
            "listen": "prerequest",
            "script": {
                "exec": ["setTimeout(function(){}, 2000); // Wait 2s for RabbitMQ to allocate"],
                "type": "javascript"
            }
        },
        {
            "listen": "test",
            "script": {
                "exec": [
                    "const response = pm.response.json();",
                    "pm.collectionVariables.set(\"outboundOrderId_D_A\", response.id);"
                ],
                "type": "javascript"
            }
        }
    ]
})

# Steps 6 to end: keep old Pick, Pack, and Order B
# Need to find them.
for s in steps:
    name = s.get('name', '')
    if '6. Pick Order A' in name or '7. GET Pick Tasks A' in name or '8. Confirm Pick Task A' in name or '9. Pack Order A' in name:
        # Keep these, they already use {{outboundOrderId_D_A}} mostly
        new_steps.append(s)
    elif '10. ' in name or '11. ' in name or '12. ' in name or '13. ' in name or '14. ' in name or '15. ' in name or '16. ' in name or '17. ' in name or '18. ' in name or '19. ' in name or '20. ' in name or '21. ' in name or '22. ' in name or '23. ' in name or '24. ' in name or '25. ' in name or '26. ' in name or '27. ' in name or '28. ' in name or '29. ' in name or '30. ' in name or '31. ' in name or '32. ' in name or '33. ' in name or '34. ' in name or '35. ' in name or '36. ' in name:
        new_steps.append(s)

case_d['item'] = new_steps

with open(FILE_PATH, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=4, ensure_ascii=False)

print("Postman collection updated successfully!")
