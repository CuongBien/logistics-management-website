import json

def print_items(items, prefix=''):
    for item in items:
        name = item.get('name', '')
        if 'Case D' in name:
            print(f"{prefix}{name}")
            for idx, sub in enumerate(item.get('item', [])):
                print(f"  {idx}: {sub.get('name')}")
        else:
            print_items(item.get('item', []), prefix + '  ')

with open('docs/postman/LMS_E2E_Collection.postman_collection.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
print_items(data.get('item', []))
