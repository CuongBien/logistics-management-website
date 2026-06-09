import requests
import json

def main():
    try:
        order_id = '21b07b73-3549-4af1-bff6-a62d2c3c770a'
        api_url = f"http://127.0.0.1:5051/api/outbound/orders/{order_id}/tracking-timeline"
        
        r = requests.get(api_url)
        print("API Status:", r.status_code)
        
        if r.status_code == 200:
            print("Response:")
            print(json.dumps(r.json(), indent=2))
        else:
            print("Error response:", r.text)
            
    except Exception as e:
        print("Error:", e)

if __name__ == '__main__':
    main()
