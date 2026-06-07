import requests

KC_URL = 'http://127.0.0.1:18080'
ADMIN_USER = 'admin'
ADMIN_PASS = 'admin'
REALM = 'logistics_realm'

def get_admin_token():
    url = f'{KC_URL}/realms/master/protocol/openid-connect/token'
    data = {'client_id': 'admin-cli', 'username': ADMIN_USER, 'password': ADMIN_PASS, 'grant_type': 'password'}
    r = requests.post(url, data=data)
    r.raise_for_status()
    return r.json()['access_token']

token = get_admin_token()
headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}

# Get users
r = requests.get(f'{KC_URL}/admin/realms/{REALM}/users', headers=headers)
users = r.json()

for u in users:
    new_pass = 'staff' if u['username'] == 'staff1' else 'admin'
    print(f"Resetting {u['username']} password to {new_pass}")
    r = requests.put(f"{KC_URL}/admin/realms/{REALM}/users/{u['id']}/reset-password", headers=headers, json={'type': 'password', 'value': new_pass, 'temporary': False})
    print(r.status_code)
