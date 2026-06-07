import requests

KC_URL = "http://127.0.0.1:18080/realms/logistics_realm/protocol/openid-connect/token"
payload = {
    'client_id': 'oms-client',
    'username': 'demo_client',
    'password': 'password123',
    'grant_type': 'password'
}
r = requests.post(KC_URL, data=payload)
if r.status_code != 200:
    print("Login failed!", r.status_code, r.text)
    exit(1)
token = r.json()['access_token']

print("Got token")
headers = {'Authorization': f'Bearer {token}'}
url = "http://127.0.0.1:5000/api/orders?pageSize=100"
r2 = requests.get(url, headers=headers)
print("Orders status:", r2.status_code)
print("Orders response:", r2.text)
