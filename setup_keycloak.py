import requests
import time
import subprocess

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
        
    # Create users with fixed UUIDs and attributes
    users_to_create = [
        {
            "id": "2036019c-ad5e-4610-9e4f-3e8fb9dfc4e8",
            "username": "admin",
            "firstName": "System",
            "lastName": "Admin",
            "email": "admin@shiphub.vn",
            "password": "admin",
            "attributes": {
                "phone": ["0987654321"],
                "employee_code": ["EMP-001"]
            }
        },
        {
            "id": "1a382041-9098-4351-ab71-d3939f8368dd",
            "username": "staff1",
            "firstName": "Nguyen",
            "lastName": "Staff",
            "email": "staff1@shiphub.vn",
            "password": "staff",
            "attributes": {
                "phone": ["0912345678"],
                "employee_code": ["EMP-002"]
            }
        },
        {
            "id": "3b382041-9098-4351-ab71-d3939f8368de",
            "username": "manager1",
            "firstName": "Nguyen",
            "lastName": "Manager",
            "email": "manager1@shiphub.vn",
            "password": "manager",
            "attributes": {
                "phone": ["0909090909"],
                "employee_code": ["EMP-003"]
            }
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
            # Update user attributes and name
            update_payload = {
                "firstName": u['firstName'],
                "lastName": u['lastName'],
                "email": u['email'],
                "attributes": u.get("attributes", {})
            }
            requests.put(f"{KC_URL}/admin/realms/{REALM}/users/{existing_user['id']}", headers=headers, json=update_payload).raise_for_status()
        else:
            print(f"Creating user {u['username']}...")
            payload = {
                "username": u['username'],
                "firstName": u['firstName'],
                "lastName": u['lastName'],
                "email": u['email'],
                "enabled": True,
                "attributes": u.get("attributes", {}),
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

    # 2. Add Roles "manager" and "operator" and assign to appropriate users
    for r_name in ["manager", "operator"]:
        r = requests.get(f"{KC_URL}/admin/realms/{REALM}/roles/{r_name}", headers=headers)
        if r.status_code == 404:
            print(f"Creating role {r_name}...")
            requests.post(f"{KC_URL}/admin/realms/{REALM}/roles", headers=headers, json={
                "name": r_name,
                "description": f"{r_name} role"
            }).raise_for_status()
            
    role_assignments = {
        "admin": "manager",
        "manager1": "manager",
        "staff1": "operator"
    }
    
    for username, role_name in role_assignments.items():
        uid = user_ids.get(username)
        if not uid:
            continue
        role_res = requests.get(f"{KC_URL}/admin/realms/{REALM}/roles/{role_name}", headers=headers)
        role_res.raise_for_status()
        role_obj = role_res.json()
        
        mappings_r = requests.get(f"{KC_URL}/admin/realms/{REALM}/users/{uid}/role-mappings/realm", headers=headers)
        mappings_r.raise_for_status()
        current_roles = [role["name"] for role in mappings_r.json()]
        if role_name not in current_roles:
            print(f"Assigning role {role_name} to user {username}...")
            requests.post(f"{KC_URL}/admin/realms/{REALM}/users/{uid}/role-mappings/realm", headers=headers, json=[role_obj]).raise_for_status()

    # 3. Create Protocol Mappers for custom attributes
    r = requests.get(f"{KC_URL}/admin/realms/{REALM}/clients?clientId={CLIENT_ID}", headers=headers)
    r.raise_for_status()
    clients_list = r.json()
    if clients_list:
        client_uuid = clients_list[0]['id']
        mappers_r = requests.get(f"{KC_URL}/admin/realms/{REALM}/clients/{client_uuid}/protocol-mappers/models", headers=headers)
        mappers_r.raise_for_status()
        existing_mappers = [m["name"] for m in mappers_r.json()]
        
        custom_mappers = [
            {
                "name": "employee_code",
                "protocol": "openid-connect",
                "protocolMapper": "oidc-usermodel-attribute-mapper",
                "consentRequired": False,
                "config": {
                    "user.attribute": "employee_code",
                    "claim.name": "employee_code",
                    "jsonType.label": "String",
                    "id.token.claim": "true",
                    "access.token.claim": "true",
                    "userinfo.token.claim": "true"
                }
            },
            {
                "name": "phone",
                "protocol": "openid-connect",
                "protocolMapper": "oidc-usermodel-attribute-mapper",
                "consentRequired": False,
                "config": {
                    "user.attribute": "phone",
                    "claim.name": "phone",
                    "jsonType.label": "String",
                    "id.token.claim": "true",
                    "access.token.claim": "true",
                    "userinfo.token.claim": "true"
                }
            }
        ]
        
        for m in custom_mappers:
            if m["name"] not in existing_mappers:
                print(f"Creating protocol mapper for {m['name']}...")
                requests.post(f"{KC_URL}/admin/realms/{REALM}/clients/{client_uuid}/protocol-mappers/models", headers=headers, json=m).raise_for_status()

    # Sync PostgreSQL test data
    customer1_id = user_ids.get("customer1")
    admin_id = user_ids.get("admin")
    staff1_id = user_ids.get("staff1")
    manager1_id = user_ids.get("manager1")
    
    print("Syncing DB test data with actual Keycloak IDs...")
    
    # WMS Database cleanup: Delete duplicate/stale operator profiles and ensure seeded role assignments in WMS DB
    print("Cleaning up stale operator profiles and ensuring seeded role assignments in WMS DB...")
    if admin_id and staff1_id and manager1_id:
        wms_user_sync_queries = [
            # 1. Delete any auto-provisioned profiles with dynamic UUIDs if they have different IDs than our fixed ones
            f'DELETE FROM operator_profiles WHERE "OperatorSub" IN (\'{admin_id}\', \'{staff1_id}\', \'{manager1_id}\') AND "Id" NOT IN (\'78fac894-240a-44a6-b83f-aec783b138a1\', \'bc474069-1431-4a35-ab96-575aceb418ae\', \'cd8423bb-f76c-456a-bc2d-b8f96a42f60f\');',
            
            # 2. Update existing seeded fixed UUID profiles to dynamic UUIDs
            f'UPDATE operator_profiles SET "OperatorSub" = \'{admin_id}\' WHERE "OperatorSub" = \'2036019c-ad5e-4610-9e4f-3e8fb9dfc4e8\';',
            f'UPDATE operator_profiles SET "OperatorSub" = \'{staff1_id}\' WHERE "OperatorSub" = \'1a382041-9098-4351-ab71-d3939f8368dd\';',
            f'UPDATE operator_profiles SET "OperatorSub" = \'{manager1_id}\' WHERE "OperatorSub" = \'3b382041-9098-4351-ab71-d3939f8368de\';',
            
            # 3. Insert profiles with dynamic UUIDs if they don't exist
            f'INSERT INTO operator_profiles ("Id", "TenantId", "OperatorSub", "DisplayName", "IsActive", "FullName", "Email", "Phone", "EmployeeCode") VALUES (\'78fac894-240a-44a6-b83f-aec783b138a1\', \'default-tenant\', \'{admin_id}\', \'System Admin\', true, \'System Admin\', \'admin@shiphub.vn\', \'0987654321\', \'EMP-001\') ON CONFLICT ("TenantId", "OperatorSub") DO NOTHING;',
            f'INSERT INTO operator_profiles ("Id", "TenantId", "OperatorSub", "DisplayName", "IsActive", "FullName", "Email", "Phone", "EmployeeCode") VALUES (\'bc474069-1431-4a35-ab96-575aceb418ae\', \'default-tenant\', \'{staff1_id}\', \'Nguyen Staff\', true, \'Nguyen Staff\', \'staff1@shiphub.vn\', \'0912345678\', \'EMP-002\') ON CONFLICT ("TenantId", "OperatorSub") DO NOTHING;',
            f'INSERT INTO operator_profiles ("Id", "TenantId", "OperatorSub", "DisplayName", "IsActive", "FullName", "Email", "Phone", "EmployeeCode") VALUES (\'cd8423bb-f76c-456a-bc2d-b8f96a42f60f\', \'default-tenant\', \'{manager1_id}\', \'Nguyen Manager\', true, \'Nguyen Manager\', \'manager1@shiphub.vn\', \'0909090909\', \'EMP-003\') ON CONFLICT ("TenantId", "OperatorSub") DO NOTHING;',
            
            # 4. Insert role assignments for admin (WMS_ADMIN)
            f'INSERT INTO "OperatorRoleAssignments" ("Id", "OperatorProfileId", "RoleId", "WarehouseId", "ZoneId", "Status", "EffectiveFrom") '
            f'SELECT gen_random_uuid(), p."Id", r."Id", w."Id", NULL, 1, NOW() '
            f'FROM operator_profiles p CROSS JOIN "Roles" r CROSS JOIN "Warehouses" w '
            f'WHERE p."OperatorSub" = \'{admin_id}\' AND r."Code" = \'WMS_ADMIN\' '
            f'ON CONFLICT ("OperatorProfileId", "WarehouseId", "RoleId", "ZoneId") DO NOTHING;',
            
            # 5. Insert role assignments for manager1 (WMS_SUPERVISOR)
            f'INSERT INTO "OperatorRoleAssignments" ("Id", "OperatorProfileId", "RoleId", "WarehouseId", "ZoneId", "Status", "EffectiveFrom") '
            f'SELECT gen_random_uuid(), p."Id", r."Id", w."Id", NULL, 1, NOW() '
            f'FROM operator_profiles p CROSS JOIN "Roles" r CROSS JOIN "Warehouses" w '
            f'WHERE p."OperatorSub" = \'{manager1_id}\' AND r."Code" = \'WMS_SUPERVISOR\' '
            f'ON CONFLICT ("OperatorProfileId", "WarehouseId", "RoleId", "ZoneId") DO NOTHING;',
            
            # 6. Insert role assignments for staff1 (WMS_OPERATOR)
            f'INSERT INTO "OperatorRoleAssignments" ("Id", "OperatorProfileId", "RoleId", "WarehouseId", "ZoneId", "Status", "EffectiveFrom") '
            f'SELECT gen_random_uuid(), p."Id", r."Id", w."Id", NULL, 1, NOW() '
            f'FROM operator_profiles p CROSS JOIN "Roles" r CROSS JOIN "Warehouses" w '
            f'WHERE p."OperatorSub" = \'{staff1_id}\' AND r."Code" = \'WMS_OPERATOR\' '
            f'ON CONFLICT ("OperatorProfileId", "WarehouseId", "RoleId", "ZoneId") DO NOTHING;',
            
            # 7. Update historical OperatorActivityLogs
            f'UPDATE "OperatorActivityLogs" SET "OperatorId" = \'{admin_id}\' WHERE "OperatorId" = \'2036019c-ad5e-4610-9e4f-3e8fb9dfc4e8\';',
            f'UPDATE "OperatorActivityLogs" SET "OperatorId" = \'{staff1_id}\' WHERE "OperatorId" = \'1a382041-9098-4351-ab71-d3939f8368dd\';',
            f'UPDATE "OperatorActivityLogs" SET "OperatorId" = \'{manager1_id}\' WHERE "OperatorId" = \'3b382041-9098-4351-ab71-d3939f8368de\';'
        ]
        for query in wms_user_sync_queries:
            subprocess.run(["docker", "exec", "lms-postgres", "psql", "-U", "postgres", "-d", "lms_wms_dev", "-c", query])




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
    
    # Ensure 'role:manage' permission and role permissions mapping exist in WMS database
    print("Ensuring 'role:manage' permission exists in WMS DB...")
    sql_insert_perm = 'INSERT INTO "Permissions" ("Id", "Code", "Resource", "Action", "IsActive") VALUES (\'00000000-0000-0000-0000-000000000030\', \'role:manage\', \'role\', \'manage\', true) ON CONFLICT ("Code") DO NOTHING;'
    subprocess.run(["docker", "exec", "lms-postgres", "psql", "-U", "postgres", "-d", "lms_wms_dev", "-c", sql_insert_perm])
    
    sql_link_wms_admin = 'INSERT INTO "RolePermissions" ("RoleId", "PermissionId") SELECT "Id", \'00000000-0000-0000-0000-000000000030\' FROM "Roles" WHERE "Name" = \'WMS_ADMIN\' ON CONFLICT DO NOTHING;'
    subprocess.run(["docker", "exec", "lms-postgres", "psql", "-U", "postgres", "-d", "lms_wms_dev", "-c", sql_link_wms_admin])
    
    print("DB synced successfully.")

if __name__ == "__main__":
    setup_keycloak()
