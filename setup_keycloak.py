import requests
import time

KC_URL = 'http://127.0.0.1:18080'
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
        
    # Create users with fixed UUIDs
    users_to_create = [
        {
            "id": "2036019c-ad5e-4610-9e4f-3e8fb9dfc4e8",
            "username": "admin",
            "firstName": "System",
            "lastName": "Admin",
            "email": "admin@shiphub.vn",
            "password": "admin"
        },
        {
            "id": "1a382041-9098-4351-ab71-d3939f8368dd",
            "username": "staff1",
            "firstName": "Nguyen",
            "lastName": "Staff",
            "email": "staff1@shiphub.vn",
            "password": "staff"
        },
        {
            "id": "5107728a-5b22-49dd-a608-718ed99dbaeb",
            "username": "customer1",
            "firstName": "Shopee",
            "lastName": "Consignor",
            "email": "customer1@shopee.vn",
            "password": "customer"
        }
    ]
    
    user_ids = {}
    for u in users_to_create:
        # Check if user exists
        r = requests.get(f"{KC_URL}/admin/realms/{REALM}/users?username={u['username']}", headers=headers)
        existing_users = r.json()
        
        if existing_users:
            existing_user = existing_users[0]
            print(f"User {u['username']} already exists with ID {existing_user['id']}.")
            user_ids[u['username']] = existing_user['id']
        else:
            print(f"Creating user {u['username']}...")
            payload = {
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
            }
            r = requests.post(f"{KC_URL}/admin/realms/{REALM}/users", headers=headers, json=payload)
            r.raise_for_status()
            
            # Retrieve the created user's ID
            r = requests.get(f"{KC_URL}/admin/realms/{REALM}/users?username={u['username']}", headers=headers)
            user_ids[u['username']] = r.json()[0]['id']

    # Ensure Admin role exists and assign to admin / staff1 users
    role_name = "Admin"
    r = requests.get(f"{KC_URL}/admin/realms/{REALM}/roles/{role_name}", headers=headers)
    if r.status_code == 404:
        print(f"Creating role {role_name}...")
        r = requests.post(f"{KC_URL}/admin/realms/{REALM}/roles", headers=headers, json={
            "name": role_name,
            "description": "Administrator Role"
        })
        r.raise_for_status()
        r = requests.get(f"{KC_URL}/admin/realms/{REALM}/roles/{role_name}", headers=headers)
        r.raise_for_status()
    else:
        r.raise_for_status()
    
    admin_role = r.json()

    users_to_assign = [
        user_ids.get("admin"),
        user_ids.get("staff1")
    ]
    for user_id in users_to_assign:
        if not user_id:
            continue
        mappings_r = requests.get(f"{KC_URL}/admin/realms/{REALM}/users/{user_id}/role-mappings/realm", headers=headers)
        mappings_r.raise_for_status()
        current_roles = [role["name"] for role in mappings_r.json()]
        if role_name not in current_roles:
            print(f"Assigning role {role_name} to user {user_id}...")
            r = requests.post(f"{KC_URL}/admin/realms/{REALM}/users/{user_id}/role-mappings/realm", headers=headers, json=[admin_role])
            r.raise_for_status()
        else:
            print(f"User {user_id} already has role {role_name}.")

    # Sync PostgreSQL test data
    customer1_id = user_ids.get("customer1")
    admin_id = user_ids.get("admin")
    staff1_id = user_ids.get("staff1")
    
    print("Syncing DB test data with actual Keycloak IDs...")
    import subprocess
    
    # WMS Database cleanup: Delete duplicate/stale operator profiles to prevent unique key violation
    print("Cleaning up stale operator profiles in WMS DB...")
    if admin_id or staff1_id:
        ids_to_clean = []
        if admin_id:
            ids_to_clean.append(f"'{admin_id}'")
        if staff1_id:
            ids_to_clean.append(f"'{staff1_id}'")
        clean_list = ", ".join(ids_to_clean)
        sql_clean_operators = f'DELETE FROM operator_profiles WHERE "OperatorSub" IN ({clean_list});'
        subprocess.run(["docker", "exec", "lms-postgres", "psql", "-U", "postgres", "-d", "lms_wms_dev", "-c", sql_clean_operators])

    # OMS update (using static ID if available, but it's already aligned with the seed)
    if customer1_id:
        sql_oms = f'UPDATE "Orders" SET "ConsignorId" = \'{customer1_id}\';'
        subprocess.run(["docker", "exec", "lms-postgres", "psql", "-U", "postgres", "-d", "lms_oms_dev", "-c", sql_oms])
    
    # WMS updates
    if customer1_id:
        wms_queries = [
            f'UPDATE "InventoryItems" SET "CustomerId" = \'{customer1_id}\';',
            f'UPDATE "InboundReceipts" SET "CustomerId" = \'{customer1_id}\';',
            f'UPDATE "InboundReceiptLines" SET "CustomerId" = \'{customer1_id}\';',
            f'UPDATE "OutboundOrders" SET "CustomerId" = \'{customer1_id}\';'
        ]
        for sql_wms in wms_queries:
            subprocess.run(["docker", "exec", "lms-postgres", "psql", "-U", "postgres", "-d", "lms_wms_dev", "-c", sql_wms])
    
    if admin_id:
        sql_wms_admin = f'UPDATE operator_profiles SET "OperatorSub" = \'{admin_id}\' WHERE "OperatorSub" = \'e8426038-ce83-4e21-a754-f1834a77267e\';'
        subprocess.run(["docker", "exec", "lms-postgres", "psql", "-U", "postgres", "-d", "lms_wms_dev", "-c", sql_wms_admin])
        
    if staff1_id:
        sql_wms_staff = f'UPDATE operator_profiles SET "OperatorSub" = \'{staff1_id}\' WHERE "OperatorSub" = \'709e4a86-7a8e-4b46-a4c3-63162ff054ba\';'
        subprocess.run(["docker", "exec", "lms-postgres", "psql", "-U", "postgres", "-d", "lms_wms_dev", "-c", sql_wms_staff])
        
    # Ensure 'role:manage' permission and role permissions mapping exist in WMS database
    print("Ensuring 'role:manage' permission exists in WMS DB...")
    sql_insert_perm = 'INSERT INTO "Permissions" ("Id", "Code", "Resource", "Action", "IsActive") VALUES (\'00000000-0000-0000-0000-000000000030\', \'role:manage\', \'role\', \'manage\', true) ON CONFLICT ("Code") DO NOTHING;'
    subprocess.run(["docker", "exec", "lms-postgres", "psql", "-U", "postgres", "-d", "lms_wms_dev", "-c", sql_insert_perm])
    
    sql_link_wms_admin = 'INSERT INTO "RolePermissions" ("RoleId", "PermissionId") VALUES (\'6fd0023b-ed50-41df-af96-250cb376d659\', \'00000000-0000-0000-0000-000000000030\') ON CONFLICT DO NOTHING;'
    subprocess.run(["docker", "exec", "lms-postgres", "psql", "-U", "postgres", "-d", "lms_wms_dev", "-c", sql_link_wms_admin])
    
    sql_link_admin_role = 'INSERT INTO "RolePermissions" ("RoleId", "PermissionId") VALUES (\'67ed1b0e-5a60-4d25-9c9c-f17df168f59a\', \'00000000-0000-0000-0000-000000000030\') ON CONFLICT DO NOTHING;'
    subprocess.run(["docker", "exec", "lms-postgres", "psql", "-U", "postgres", "-d", "lms_wms_dev", "-c", sql_link_admin_role])
    
    print("DB synced successfully.")

if __name__ == "__main__":
    setup_keycloak()
