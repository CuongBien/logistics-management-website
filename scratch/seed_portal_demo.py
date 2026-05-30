import requests
import psycopg2
import uuid
from datetime import datetime, timedelta

KEYCLOAK_URL = 'http://127.0.0.1:18080'
KC_ADMIN = 'admin'
KC_PASS = 'admin'
REALM = 'logistics_realm'

# PostgreSQL connections
DB_OMS = "dbname=lms_oms_dev user=postgres password=postgres host=127.0.0.1 port=56432"
DB_MASTER = "dbname=lms_master_dev user=postgres password=postgres host=127.0.0.1 port=56432"

TENANT_ID = 'tenant-demo'
USER_ID = 'demo_client'

def get_kc_admin_token():
    url = f"{KEYCLOAK_URL}/realms/master/protocol/openid-connect/token"
    payload = {
        'client_id': 'admin-cli',
        'username': KC_ADMIN,
        'password': KC_PASS,
        'grant_type': 'password'
    }
    r = requests.post(url, data=payload)
    r.raise_for_status()
    return r.json()['access_token']

def create_kc_user(token):
    url = f"{KEYCLOAK_URL}/admin/realms/{REALM}/users"
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    # Check if exists
    r_check = requests.get(url + f"?username={USER_ID}", headers=headers)
    if r_check.json():
        print(f"User {USER_ID} already exists in Keycloak.")
        return r_check.json()[0]['id']

    payload = {
        "username": USER_ID,
        "enabled": True,
        "firstName": "Khách hàng",
        "lastName": "Demo",
        "email": "demo@shiphub.vn",
        "credentials": [{"type": "password", "value": "password123", "temporary": False}],
        "attributes": {
            "tenant": [TENANT_ID]
        }
    }
    r = requests.post(url, json=payload, headers=headers)
    if r.status_code == 201:
        print(f"Created user {USER_ID} in Keycloak with password 'password123'.")
        # Fetch it back to get ID
        r_check = requests.get(url + f"?username={USER_ID}", headers=headers)
        return r_check.json()[0]['id']
    else:
        print("Failed to create user:", r.text)
        return None

def seed_master_data():
    conn = psycopg2.connect(DB_MASTER)
    cur = conn.cursor()
    try:
        # Create partners
        partners = [
            (str(uuid.uuid4()), TENANT_ID, 'Cửa hàng Phụ kiện A', '090111222', '123 Nguyễn Văn Linh', 'Hồ Chí Minh', True, datetime.now(), 0, 'P001'),
            (str(uuid.uuid4()), TENANT_ID, 'Kho Online B', '0988777666', '45 Trần Phú', 'Đà Nẵng', True, datetime.now(), 0, 'P002'),
        ]
        for p in partners:
            cur.execute("""
                INSERT INTO "Partners" ("Id", "TenantId", "Name", "Phone", "Address", "City", "IsActive", "CreatedAt", "Type", "Code")
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT ("Id") DO NOTHING
            """, p)
        conn.commit()
        print("Seeded MasterData (Partners).")
    except Exception as e:
        print("Error in MasterData seeding:", e)
        conn.rollback()
    finally:
        conn.close()

def seed_oms_orders(kc_user_sub):
    conn = psycopg2.connect(DB_OMS)
    cur = conn.cursor()
    try:
        # Generate 10 orders
        now = datetime.now()
        
        for i in range(1, 11):
            order_id = str(uuid.uuid4())
            waybill_code = f"SH26{now.strftime('%m%d')}{i:03d}"
            status = i % 5  # integer enum for status
            
            cur.execute("""
                INSERT INTO "Orders" ("Id", "WaybillCode", "TenantId", "ConsignorId", "CustomerId", "Status", 
                                      "Consignee_FullName", "Consignee_Address_City", "Weight", "CodAmount", "ShippingFee", "CreatedAt", "Type", "Fulfillment", "Consignee_Phone", "Consignee_Address_Street", "Consignee_Address_State", "Consignee_Address_Country", "Consignee_Address_ZipCode")
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT ("Id") DO NOTHING
            """, (order_id, waybill_code, TENANT_ID, kc_user_sub, kc_user_sub, status, f"Khách hàng {i}", "Hồ Chí Minh", i * 1.5, i * 150000, 30000, now - timedelta(days=i), 0, 0, "0999999999", "Street", "State", "Country", "00000"))

            # Insert history
            history_id = str(uuid.uuid4())
            cur.execute("""
                INSERT INTO "OrderStatusHistories" ("Id", "OrderId", "StatusFrom", "StatusTo", "ChangedAtUtc", "ChangedByOperatorId", "Reason", "TenantId", "CorrelationId", "Source")
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT ("Id") DO NOTHING
            """, (history_id, order_id, status, status, now - timedelta(days=i, hours=-1), "System", "Demo initialization", TENANT_ID, "corr123", "System"))
            
        conn.commit()
        print(f"Seeded 10 demo orders in OMS for user {kc_user_sub}.")
    except Exception as e:
        print("Error in OMS seeding:", e)
        conn.rollback()
    finally:
        conn.close()

if __name__ == '__main__':
    print("--- Starting Seed ---")
    try:
        token = get_kc_admin_token()
        print("Got Keycloak admin token.")
        sub = create_kc_user(token)
        if sub:
            seed_master_data()
            seed_oms_orders(sub)
            print("--- Seed Completed Successfully ---")
            print("You can now login to Portal with: demo_client / password123")
    except Exception as e:
        print("Failed to run seeder:", e)
