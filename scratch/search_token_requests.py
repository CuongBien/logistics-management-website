import json

FILE_PATH = r'd:\Logistics\docs\postman\LMS_E2E_Collection.postman_collection.json'

with open(FILE_PATH, 'r', encoding='utf-8') as f:
    data = json.load(f)

def scan_items(items):
    for item in items:
        if 'request' in item:
            req = item['request']
            name = item['name']
            url = req.get('url', {}).get('raw', '')
            if 'token' in url.lower() or 'auth' in url.lower() or 'realms' in url.lower():
                print(f"Request: {name} -> {url}")
        if 'item' in item:
            scan_items(item['item'])

scan_items(data.get('item', []))
