import requests
import psycopg2

KEYCLOAK_URL = 'http://127.0.0.1:18080'
KC_REALM = 'logistics_realm'
DB_URL = "postgresql://postgres:postgres@127.0.0.1:56432/lms_oms_dev"

def get_admin_token():
    url = f"{KEYCLOAK_URL}/realms/master/protocol/openid-connect/token"
    payload = {
        'client_id': 'admin-cli',
        'username': 'admin',
        'password': 'admin',
        'grant_type': 'password'
    }
    r = requests.post(url, data=payload)
    r.raise_for_status()
    return r.json()['access_token']

def get_demo_user_id(token):
    url = f"{KEYCLOAK_URL}/admin/realms/{KC_REALM}/users?username=demo_client"
    headers = {'Authorization': f'Bearer {token}'}
    r = requests.get(url, headers=headers)
    r.raise_for_status()
    users = r.json()
    if not users:
        raise Exception("demo_client not found")
    return users[0]['id']

def update_db(user_id):
    print(f"Updating Orders in DB to consignor_id = {user_id}")
    conn = psycopg2.connect(DB_URL)
    conn.autocommit = True
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE "Orders" 
        SET "ConsignorId" = %s 
        WHERE "ConsignorId" = 'cust-demo-1'
    """, (user_id,))
    print(f"Updated {cursor.rowcount} orders.")
    conn.close()

if __name__ == '__main__':
    try:
        token = get_admin_token()
        user_id = get_demo_user_id(token)
        print(f"demo_client sub = {user_id}")
        update_db(user_id)
    except Exception as e:
        print(f"Error: {e}")
