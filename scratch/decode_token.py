import requests
import jwt

KC_URL = "http://127.0.0.1:18080/realms/logistics_realm/protocol/openid-connect/token"
payload = {
    'client_id': 'oms-client',
    'username': 'demo_client',
    'password': 'password123',
    'grant_type': 'password'
}
r = requests.post(KC_URL, data=payload)
token = r.json()['access_token']
decoded = jwt.decode(token, options={"verify_signature": False})
print("Sub:", decoded.get("sub"))
print("Tenant:", decoded.get("tenant"))
print("Tenant_id:", decoded.get("tenant_id"))
