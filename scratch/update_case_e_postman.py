import json

FILE_PATH = 'docs/postman/LMS_E2E_Collection.postman_collection.json'

with open(FILE_PATH, 'r', encoding='utf-8') as f:
    data = json.load(f)

def get_folder(items, name):
    for item in items:
        if name in item.get('name', ''):
            return item
        if 'item' in item:
            res = get_folder(item['item'], name)
            if res: return res
    return None

adv_scenarios = get_folder(data.get('item', []), 'Advanced Scenarios')
case_e = get_folder(adv_scenarios['item'], 'Case E')

# Add steps 5 to 7 to Case E
if case_e:
    case_e['item'].extend([
        {
            "name": "5. Receive Package at Final Hub (HP) - Cross-region Consignment",
            "request": {
                "method": "POST",
                "header": [{"key": "Content-Type", "value": "application/json"}],
                "body": {
                    "mode": "raw",
                    "raw": json.dumps({
                        "orderId": "{{orderId_E}}",
                        "warehouseId": "c72b9072-6349-4b29-911c-446dd304f136"
                    }, indent=4)
                },
                "url": {
                    "raw": "{{wms_url}}/api/inbound/transit/receive",
                    "host": ["{{wms_url}}"],
                    "path": ["api", "inbound", "transit", "receive"]
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
            "name": "6. Putaway (Transfer) from Transit Bin to Storage Bin at HP",
            "request": {
                "method": "POST",
                "header": [{"key": "Content-Type", "value": "application/json"}],
                "body": {
                    "mode": "raw",
                    "raw": json.dumps({
                        "warehouseId": "c72b9072-6349-4b29-911c-446dd304f136",
                        "sku": "SKU-BLUE-SHIRT",
                        "sourceBinId": "d6fa0a0f-623b-4179-8d47-66c30bb5d565", 
                        "destinationBinId": "e81c1c1a-735a-4b30-a22d-77d41cc6e577",
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
    ])

with open(FILE_PATH, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=4, ensure_ascii=False)

print("Updated Case E with Transit Receive and Putaway steps.")
