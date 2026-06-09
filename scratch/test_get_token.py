import requests
import json

KEYCLOAK_URL = 'http://127.0.0.1:18080'
REALM = 'logistics_realm'

def get_demo_token():
    url = f"{KEYCLOAK_URL}/realms/{REALM}/protocol/openid-connect/token"
    payload = {
        'client_id': 'oms-client',
        'client_secret': 'my-secret',
        'username': 'demo_client',
        'password': 'password123',
        'grant_type': 'password'
    }
    r = requests.post(url, data=payload)
    r.raise_for_status()
    return r.json()['access_token']

def main():
    try:
        token = get_demo_token()
        print("Success! Got access token.")
        
        wave_id = '9d9419fa-90dc-4e26-babb-2c6d23dc6477'
        api_url = f"http://127.0.0.1:5051/api/outbound/waves/{wave_id}/pick-tasks"
        
        headers = {
            'Authorization': f'Bearer {token}'
        }
        
        r = requests.get(api_url, headers=headers)
        print("Pick Tasks API Status:", r.status_code)
        if r.status_code == 200:
            print("Successfully loaded pick tasks!")
            
            # Now let's query the wave status via the WMS API too
            wave_url = f"http://127.0.0.1:5051/api/outbound/waves/{wave_id}"
            r2 = requests.get(wave_url, headers=headers)
            print("Wave Details API Status:", r2.status_code)
            if r2.status_code == 200:
                print("Wave Details Response:")
                print(json.dumps(r2.json(), indent=2))
        else:
            print("Pick Tasks API Error:", r.text)
            
    except Exception as e:
        print("Error:", e)

if __name__ == '__main__':
    main()
