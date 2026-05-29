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
case_e = get_folder(adv_scenarios['item'], 'Case E') if adv_scenarios else None

if case_e:
    print(f"Folder: {case_e['name']}")
    for idx, item in enumerate(case_e.get('item', [])):
        print(f"Step {idx+1}: {item['name']}")
        req = item.get('request', {})
        print(f"  Method: {req.get('method')}")
        print(f"  URL: {req.get('url', {}).get('raw')}")
        body = req.get('body', {}).get('raw', '')
        if body:
            print(f"  Body: {body.strip()}")
else:
    print("Case E not found!")
