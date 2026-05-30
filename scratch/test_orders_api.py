import requests

KEYCLOAK_URL = 'http://127.0.0.1:18080'
KC_REALM = 'logistics_realm'

def get_demo_token():
    url = f"{KEYCLOAK_URL}/realms/{KC_REALM}/protocol/openid-connect/token"
    payload = {
        'client_id': 'portal-client',
        'username': 'demo_client',
        'password': 'demo',
        'grant_type': 'password'
    }
    r = requests.post(url, data=payload)
    r.raise_for_status()
    return r.json()['access_token']

if __name__ == '__main__':
    try:
        url = "http://127.0.0.1:3000/api/oms/orders?pageSize=100"
        r = requests.get(url)
        print("Status:", r.status_code)
        print("Response:", r.text)
    except Exception as e:
        print(f"Error: {e}")
