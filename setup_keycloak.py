import requests
import time

KC_URL = 'http://localhost:18080'
ADMIN_USER = 'admin'
ADMIN_PASS = 'admin'
REALM = 'logistics_realm'
CLIENT_ID = 'oms-client'
CLIENT_SECRET = 'my-secret'

def get_admin_token():
    url = f"{KC_URL}/realms/master/protocol/openid-connect/token"
    data = {
        'client_id': 'admin-cli',
        'username': ADMIN_USER,
        'password': ADMIN_PASS,
        'grant_type': 'password'
    }
    r = requests.post(url, data=data)
    r.raise_for_status()
    return r.json()['access_token']

def setup_keycloak():
    print("Getting admin token...")
    token = get_admin_token()
    headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    
    # Check if realm exists
    r = requests.get(f"{KC_URL}/admin/realms/{REALM}", headers=headers)
    if r.status_code == 404:
        print(f"Creating realm {REALM}...")
        r = requests.post(f"{KC_URL}/admin/realms", headers=headers, json={
            "id": REALM,
            "realm": REALM,
            "enabled": True
        })
        r.raise_for_status()
    else:
        print(f"Realm {REALM} already exists.")
        
    # Check if client exists
    r = requests.get(f"{KC_URL}/admin/realms/{REALM}/clients?clientId={CLIENT_ID}", headers=headers)
    clients = r.json()
    if not clients:
        print(f"Creating client {CLIENT_ID}...")
        r = requests.post(f"{KC_URL}/admin/realms/{REALM}/clients", headers=headers, json={
            "clientId": CLIENT_ID,
            "enabled": True,
            "directAccessGrantsEnabled": True,
            "secret": CLIENT_SECRET,
            "publicClient": False,
            "protocol": "openid-connect"
        })
        r.raise_for_status()
    else:
        print(f"Client {CLIENT_ID} already exists.")
        
    # Create users
    users_to_create = [
        {"username": "admin", "firstName": "System", "lastName": "Admin", "email": "admin@shiphub.vn", "password": "admin"},
        {"username": "staff1", "firstName": "Nguyen", "lastName": "Staff", "email": "staff1@shiphub.vn", "password": "staff"}
    ]
    
    for u in users_to_create:
        # Check if user exists
        r = requests.get(f"{KC_URL}/admin/realms/{REALM}/users?username={u['username']}", headers=headers)
        if not r.json():
            print(f"Creating user {u['username']}...")
            r = requests.post(f"{KC_URL}/admin/realms/{REALM}/users", headers=headers, json={
                "username": u['username'],
                "firstName": u['firstName'],
                "lastName": u['lastName'],
                "email": u['email'],
                "enabled": True,
                "credentials": [{
                    "type": "password",
                    "value": u['password'],
                    "temporary": False
                }]
            })
            r.raise_for_status()
        else:
            print(f"User {u['username']} already exists.")

if __name__ == "__main__":
    setup_keycloak()
