import json

FILE_PATH = r'd:\Logistics\docs\postman\LMS_E2E_Collection.postman_collection.json'

with open(FILE_PATH, 'r', encoding='utf-8') as f:
    data = json.load(f)

def find_folder(items, folder_name):
    for item in items:
        if item.get('name') == folder_name:
            return item
        if 'item' in item:
            res = find_folder(item['item'], folder_name)
            if res:
                return res
    return None

case_d = find_folder(data.get('item', []), 'Case D: Multi-Mode Multi-Leg Hub Transit (Case A + Case B)')

if case_d:
    print("Found Case D folder!")
    
    # Check if steps 37 and 38 already exist to avoid duplicate injection
    existing_names = [item['name'] for item in case_d['item']]
    if any("37. GET Bins Hierarchy" in name for name in existing_names):
        print("Steps 37 and 38 already exist. No changes needed.")
    else:
        # Step 37
        step37 = {
            "name": "37. GET Bins Hierarchy at HP (Extract Bin IDs)",
            "request": {
                "method": "GET",
                "header": [],
                "url": {
                    "raw": "{{wms_url}}/api/Warehouse/f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f6f6/hierarchy",
                    "host": [
                        "{{wms_url}}"
                    ],
                    "path": [
                        "api",
                        "Warehouse",
                        "f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f6f6",
                        "hierarchy"
                    ]
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
                            "pm.collectionVariables.set(\"sourceBinId_D\", sourceBinId);",
                            "pm.collectionVariables.set(\"destBinId_D\", destBinId);"
                        ],
                        "type": "javascript"
                    }
                }
            ]
        }
        
        # Step 38
        step38 = {
            "name": "38. Putaway (Transfer) from Transit Bin to Storage Bin at HP",
            "request": {
                "method": "POST",
                "header": [
                    {
                        "key": "Content-Type",
                        "value": "application/json"
                    }
                ],
                "body": {
                    "mode": "raw",
                    "raw": "{\n    \"warehouseId\": \"f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f6f6\",\n    \"sku\": \"SKU-RED-TSHIRT\",\n    \"sourceBinId\": \"{{sourceBinId_D}}\",\n    \"destinationBinId\": \"{{destBinId_D}}\",\n    \"quantity\": 152\n}"
                },
                "url": {
                    "raw": "{{wms_url}}/api/inventory/transfer",
                    "host": [
                        "{{wms_url}}"
                    ],
                    "path": [
                        "api",
                        "inventory",
                        "transfer"
                    ]
                }
            }
        }
        
        case_d['item'].append(step37)
        case_d['item'].append(step38)
        print("Appended Step 37 and Step 38 successfully!")
        
        with open(FILE_PATH, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
        print("Saved collection changes successfully!")
else:
    print("Could not find Case D folder.")
