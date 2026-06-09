import requests

def get_token():
    url = "http://127.0.0.1:18080/realms/logistics_realm/protocol/openid-connect/token"
    data = {
        "grant_type": "password",
        "client_id": "oms-client",
        "client_secret": "my-secret",
        "username": "admin",
        "password": "admin"
    }
    r = requests.post(url, data=data)
    r.raise_for_status()
    return r.json()["access_token"]

def main():
    try:
        token = get_token()
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test BIN-RETURN ID from HCM warehouse
        bin_id = "6384356f-11ec-4b71-972a-e956ceb34d92"
        api_url = f"http://127.0.0.1:5051/api/qrcode/bin/{bin_id}"
        
        print(f"Requesting QR code for bin ID: {bin_id} ...")
        res = requests.get(api_url, headers=headers)
        print("Status code:", res.status_code)
        print("Headers:", dict(res.headers))
        
        if res.status_code == 200:
            print("Content length:", len(res.content))
            print("Starts with:", res.content[:20])
        else:
            print("Response text:", res.text)
            
    except Exception as e:
        print("Error:", e)

if __name__ == '__main__':
    main()
