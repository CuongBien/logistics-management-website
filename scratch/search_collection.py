import json

FILE_PATH = 'docs/postman/LMS_E2E_Collection.postman_collection.json'

with open(FILE_PATH, 'r', encoding='utf-8') as f:
    data = json.load(f)

def find_request_by_name(items, name, found=None):
    if found is None: found = []
    for item in items:
        if name in item.get('name', ''):
            found.append(item)
        if 'item' in item:
            find_request_by_name(item['item'], name, found)
    return found

reqs = find_request_by_name(data.get('item', []), 'shipment')
for r in reqs:
    print(f"Name: {r['name']}")
    if 'request' in r:
        print(f"  URL: {r['request'].get('url', {}).get('raw')}")
