import sys
import argparse
import requests
import psycopg2
import uuid
from datetime import datetime, timedelta
import random
from decimal import Decimal

# Keycloak Config
KC_URL = 'http://127.0.0.1:18080'
ADMIN_USER = 'admin'
ADMIN_PASS = 'admin'
REALM = 'logistics_realm'

# DB Connections
DB_MASTER = "dbname=lms_master_dev user=postgres password=postgres host=127.0.0.1 port=56432"
DB_OMS = "dbname=lms_oms_dev user=postgres password=postgres host=127.0.0.1 port=56432"
DB_WMS = "dbname=lms_wms_dev user=postgres password=postgres host=127.0.0.1 port=56432"

TENANT_ID = 'default-tenant'

# 50+ Diverse SKUs
SKUS = [
    # Apparel (Quần áo, Thời trang)
    {"SkuCode": "SKU-APP-001", "Name": "Coolmate Cotton T-Shirt Black M", "Unit": "PCS"},
    {"SkuCode": "SKU-APP-002", "Name": "Coolmate Cotton T-Shirt Black L", "Unit": "PCS"},
    {"SkuCode": "SKU-APP-003", "Name": "Coolmate Cotton T-Shirt White M", "Unit": "PCS"},
    {"SkuCode": "SKU-APP-004", "Name": "Coolmate Cotton T-Shirt White L", "Unit": "PCS"},
    {"SkuCode": "SKU-APP-005", "Name": "Ananas Trackas Sneakers Red 40", "Unit": "PCS"},
    {"SkuCode": "SKU-APP-006", "Name": "Ananas Trackas Sneakers Red 41", "Unit": "PCS"},
    {"SkuCode": "SKU-APP-007", "Name": "Ananas Trackas Sneakers Red 42", "Unit": "PCS"},
    {"SkuCode": "SKU-APP-008", "Name": "Bomber Jacket Windproof Black XL", "Unit": "PCS"},
    {"SkuCode": "SKU-APP-009", "Name": "Cargo Pants Heavy Cotton Olive L", "Unit": "PCS"},
    {"SkuCode": "SKU-APP-010", "Name": "Socks Crew Breathable 3-Pack", "Unit": "PCS"},
    {"SkuCode": "SKU-APP-011", "Name": "Sport Shorts Athletic Navy M", "Unit": "PCS"},
    {"SkuCode": "SKU-APP-012", "Name": "Hoodie Fleece Oversized Grey L", "Unit": "PCS"},
    {"SkuCode": "SKU-APP-013", "Name": "Leather Wallet Slim Classic Brown", "Unit": "PCS"},
    {"SkuCode": "SKU-APP-014", "Name": "Canvas Tote Bag Durable Cream", "Unit": "PCS"},
    {"SkuCode": "SKU-APP-015", "Name": "Baseball Cap Sun Visor Navy Blue", "Unit": "PCS"},

    # Electronics (Thiết bị điện tử)
    {"SkuCode": "SKU-ELE-001", "Name": "iPhone USB-C Fast Charger 20W", "Unit": "PCS"},
    {"SkuCode": "SKU-ELE-002", "Name": "Wireless Silent Mouse 1600 DPI", "Unit": "PCS"},
    {"SkuCode": "SKU-ELE-003", "Name": "Bluetooth Mechanical Keyboard Blue Switch", "Unit": "PCS"},
    {"SkuCode": "SKU-ELE-004", "Name": "USB-C to USB-C Cable Braided 2m", "Unit": "PCS"},
    {"SkuCode": "SKU-ELE-005", "Name": "True Wireless Earbuds ANC Black", "Unit": "PCS"},
    {"SkuCode": "SKU-ELE-006", "Name": "Power Bank 20000mAh PD Fast Charge", "Unit": "PCS"},
    {"SkuCode": "SKU-ELE-007", "Name": "Phone Stand Foldable Metal Black", "Unit": "PCS"},
    {"SkuCode": "SKU-ELE-008", "Name": "HDMI 2.0 Cable High Speed 1.8m", "Unit": "PCS"},
    {"SkuCode": "SKU-ELE-009", "Name": "Bluetooth Speaker Waterproof Outdoor", "Unit": "PCS"},
    {"SkuCode": "SKU-ELE-010", "Name": "Laptop Sleeve Water Resistant 14 inch", "Unit": "PCS"},
    {"SkuCode": "SKU-ELE-011", "Name": "USB Hub 4-Port Type-C Multiport", "Unit": "PCS"},
    {"SkuCode": "SKU-ELE-012", "Name": "Webcam 1080p HD Focus Auto Mic", "Unit": "PCS"},
    {"SkuCode": "SKU-ELE-013", "Name": "Desk Pad PU Leather Large Black", "Unit": "PCS"},
    {"SkuCode": "SKU-ELE-014", "Name": "Screen Cleaning Kit Spray with Cloth", "Unit": "PCS"},
    {"SkuCode": "SKU-ELE-015", "Name": "Smart Fitness Band 7 Waterproof", "Unit": "PCS"},

    # Food & Beverage (Thực phẩm & Đồ uống)
    {"SkuCode": "SKU-FAB-001", "Name": "Coca Cola Zero Sugar Can 320ml", "Unit": "PCS"},
    {"SkuCode": "SKU-FAB-002", "Name": "Potato Chips Lay's Classic Salted 150g", "Unit": "PCS"},
    {"SkuCode": "SKU-FAB-003", "Name": "Hao Hao Sour Shrimp Instant Noodles 75g", "Unit": "PCS"},
    {"SkuCode": "SKU-FAB-004", "Name": "Aquafina Purified Water Bottle 500ml", "Unit": "PCS"},
    {"SkuCode": "SKU-FAB-005", "Name": "Oolong Tea C2 Refreshing Bottle 455ml", "Unit": "PCS"},
    {"SkuCode": "SKU-FAB-006", "Name": "Mixed Nuts Roast & Salted Almond/Cashew", "Unit": "PCS"},
    {"SkuCode": "SKU-FAB-007", "Name": "Milk Chocolate Bar Hazelnut 100g", "Unit": "PCS"},
    {"SkuCode": "SKU-FAB-008", "Name": "Ground Coffee Arabica Blend Dark Roast 500g", "Unit": "PCS"},
    {"SkuCode": "SKU-FAB-009", "Name": "Matcha Green Tea Powder Premium 100g", "Unit": "PCS"},
    {"SkuCode": "SKU-FAB-010", "Name": "Energy Drink Red Bull Gold Can 250ml", "Unit": "PCS"},

    # Cosmetics (Mỹ phẩm, Chăm sóc cá nhân)
    {"SkuCode": "SKU-COS-001", "Name": "Facial Cleanser Acne Defense Foam 150ml", "Unit": "PCS"},
    {"SkuCode": "SKU-COS-002", "Name": "Sunscreen SPF 50+ UV Defense Gel 50ml", "Unit": "PCS"},
    {"SkuCode": "SKU-COS-003", "Name": "Hydrating Moisturizer Ceramide Cream 80ml", "Unit": "PCS"},
    {"SkuCode": "SKU-COS-004", "Name": "Moisturizing Lip Balm Extra Care Coconut", "Unit": "PCS"},
    {"SkuCode": "SKU-COS-005", "Name": "Shampoo Anti-Dandruff Menthol Cool 400ml", "Unit": "PCS"},
    {"SkuCode": "SKU-COS-006", "Name": "Shower Gel Moisture Deep Clean 500ml", "Unit": "PCS"},
    {"SkuCode": "SKU-COS-007", "Name": "Micellar Water Sensitive Makeup Remover 400ml", "Unit": "PCS"},
    {"SkuCode": "SKU-COS-008", "Name": "Clay Mask Pore Clarifying Green Tea 100g", "Unit": "PCS"},
    {"SkuCode": "SKU-COS-009", "Name": "Hand Cream Nourishing Shea Butter 30ml", "Unit": "PCS"},
    {"SkuCode": "SKU-COS-010", "Name": "Body Lotion Aloe Vera Soothing 250ml", "Unit": "PCS"},
]

def get_kc_admin_token():
    url = f"{KC_URL}/realms/master/protocol/openid-connect/token"
    payload = {
        'client_id': 'admin-cli',
        'username': ADMIN_USER,
        'password': ADMIN_PASS,
        'grant_type': 'password'
    }
    r = requests.post(url, data=payload)
    r.raise_for_status()
    return r.json()['access_token']

def create_kc_user(token, username, first_name, last_name, email, password):
    url = f"{KC_URL}/admin/realms/{REALM}/users"
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    # Check if exists
    r_check = requests.get(url + f"?username={username}", headers=headers)
    r_check.raise_for_status()
    users = r_check.json()
    if users:
        print(f"User {username} already exists in Keycloak (ID: {users[0]['id']}).")
        return users[0]['id']

    payload = {
        "username": username,
        "enabled": True,
        "firstName": first_name,
        "lastName": last_name,
        "email": email,
        "credentials": [{"type": "password", "value": password, "temporary": False}],
        "attributes": {
            "tenant": [TENANT_ID]
        }
    }
    r = requests.post(url, json=payload, headers=headers)
    if r.status_code == 201:
        print(f"Created user {username} in Keycloak.")
        # Fetch user details to get ID
        r_check = requests.get(url + f"?username={username}", headers=headers)
        return r_check.json()[0]['id']
    else:
        print(f"Failed to create user {username}:", r.text)
        return None

def assign_kc_role(token, user_id, role_name):
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    # Get role object
    url_role = f"{KC_URL}/admin/realms/{REALM}/roles/{role_name}"
    r_role = requests.get(url_role, headers=headers)
    if r_role.status_code != 200:
        print(f"Role {role_name} not found in Keycloak.")
        return
    role_obj = r_role.json()
    
    # Check current role mappings
    url_mappings = f"{KC_URL}/admin/realms/{REALM}/users/{user_id}/role-mappings/realm"
    r_map = requests.get(url_mappings, headers=headers)
    r_map.raise_for_status()
    current_roles = [role['name'] for role in r_map.json()]
    
    if role_name not in current_roles:
        r = requests.post(url_mappings, json=[role_obj], headers=headers)
        if r.status_code in (200, 201, 204):
            print(f"Assigned role {role_name} to user in Keycloak.")
        else:
            print(f"Failed to assign role {role_name}:", r.text)
    else:
        print(f"User already has role {role_name} in Keycloak.")

def seed_phase_1():
    print("\n=== STARTING PHASE 1: Keycloak Users, SKUs, and Partners ===")
    
    # 1. KEYCLOAK & OPERATOR PROFILES (WMS)
    print("Connecting to Keycloak...")
    try:
        token = get_kc_admin_token()
        print("Got Keycloak admin token.")
    except Exception as e:
        print(f"Failed to connect to Keycloak: {e}. Ensure docker container is running.")
        sys.exit(1)

    # Core system users to check/create
    core_users = [
        {"username": "admin", "firstName": "System", "lastName": "Admin", "email": "admin@shiphub.vn", "password": "admin", "role": "WMS_ADMIN"},
        {"username": "staff1", "firstName": "Nguyen", "lastName": "Staff", "email": "staff1@shiphub.vn", "password": "staff", "role": "WMS_OPERATOR"},
        {"username": "customer1", "firstName": "Shopee", "lastName": "Consignor", "email": "customer1@shopee.vn", "password": "customer", "role": "Customer"}
    ]

    # 10 operators to create
    operators_to_create = []
    for i in range(2, 12):
        operators_to_create.append({
            "username": f"staff{i}",
            "firstName": f"Staff-{i}",
            "lastName": "Operator",
            "email": f"staff{i}@shiphub.vn",
            "password": "password123",
            "role": "Admin" if i >= 10 else "Operator" # staff10 and staff11 are admins
        })

    operator_subs = {}
    customer1_id = None

    # Sync core users first
    for u in core_users:
        sub = create_kc_user(token, u["username"], u["firstName"], u["lastName"], u["email"], u["password"])
        if sub:
            if u["role"] != "Customer":
                operator_subs[u["username"]] = sub
                if u["role"] == "WMS_ADMIN":
                    assign_kc_role(token, sub, "Admin")
            else:
                customer1_id = sub

    # Create other staff users
    for op in operators_to_create:
        sub = create_kc_user(token, op["username"], op["firstName"], op["lastName"], op["email"], op["password"])
        if sub:
            operator_subs[op["username"]] = sub
            if op["role"] == "Admin":
                assign_kc_role(token, sub, "Admin")

    # Connect to databases
    conn_wms = psycopg2.connect(DB_WMS)
    cur_wms = conn_wms.cursor()
    
    conn_master = psycopg2.connect(DB_MASTER)
    cur_master = conn_master.cursor()

    conn_oms = psycopg2.connect(DB_OMS)
    cur_oms = conn_oms.cursor()

    try:
        # 1.1 Insert WMS Operator Profiles and Role Assignments
        print("Seeding WMS Operator Profiles and Role Assignments...")
        
        # Clean up old static profiles if present to prevent duplicates/orphans
        old_subs = ["2036019c-ad5e-4610-9e4f-3e8fb9dfc4e8", "1a382041-9098-4351-ab71-d3939f8368dd"]
        cur_wms.execute('DELETE FROM operator_profiles WHERE "OperatorSub" IN (%s, %s);', tuple(old_subs))
        
        # Get standard role IDs from WMS DB
        cur_wms.execute('SELECT "Id", "Code" FROM "Roles";')
        roles = {row[1]: row[0] for row in cur_wms.fetchall()}
        print(f"Found WMS roles in DB: {roles}")
        
        # Get warehouse IDs
        cur_wms.execute('SELECT "Id", "Code" FROM "Warehouses";')
        warehouses = [row[0] for row in cur_wms.fetchall()]
        print(f"Found {len(warehouses)} warehouses in WMS DB.")

        # Display names mapping
        display_names = {
            "admin": "System Admin",
            "staff1": "Nguyen Staff"
        }
        for i in range(2, 12):
            display_names[f"staff{i}"] = f"System Staff Staff{i}"

        for username, sub in operator_subs.items():
            display_name = display_names.get(username, f"System Staff {username.capitalize()}")
            
            # Check if operator profile already exists for this sub
            cur_wms.execute('SELECT "Id" FROM operator_profiles WHERE "OperatorSub" = %s', (sub,))
            row = cur_wms.fetchone()
            if row:
                profile_id = row[0]
                cur_wms.execute('UPDATE operator_profiles SET "DisplayName" = %s WHERE "Id" = %s;', (display_name, profile_id))
                print(f"Operator profile for {username} already exists with ID {profile_id}. Display name updated.")
            else:
                profile_id = str(uuid.uuid4())
                cur_wms.execute("""
                    INSERT INTO operator_profiles ("Id", "TenantId", "OperatorSub", "DisplayName", "IsActive")
                    VALUES (%s, %s, %s, %s, %s);
                """, (profile_id, TENANT_ID, sub, display_name, True))
                print(f"Created WMS operator profile for {username}.")

            # Assign roles across warehouses
            wms_role_code = "WMS_OPERATOR"
            if username in ("admin", "staff10", "staff11"):
                wms_role_code = "WMS_ADMIN"
            elif username in ("staff7", "staff8", "staff9"):
                wms_role_code = "WMS_SUPERVISOR"
            
            role_uuid = roles.get(wms_role_code)
            if role_uuid and warehouses:
                for wh_uuid in warehouses:
                    cur_wms.execute("""
                        INSERT INTO "OperatorRoleAssignments" ("Id", "OperatorProfileId", "RoleId", "WarehouseId", "ZoneId", "Status", "EffectiveFrom")
                        VALUES (%s, %s, %s, %s, NULL, 1, NOW())
                        ON CONFLICT ("OperatorProfileId", "WarehouseId", "RoleId", "ZoneId") DO NOTHING;
                    """, (str(uuid.uuid4()), profile_id, role_uuid, wh_uuid))
        
        conn_wms.commit()
        print("Successfully seeded all WMS operators & role assignments.")

        # Update customer1 ID references in WMS and OMS
        if customer1_id:
            print(f"Syncing customer1 references to ID: {customer1_id}...")
            # Update OMS
            cur_oms.execute('UPDATE "Orders" SET "ConsignorId" = %s, "CustomerId" = %s;', (customer1_id, customer1_id))
            conn_oms.commit()
            print("Updated customer1 Orders in OMS database.")

            # Update WMS
            cur_wms.execute('UPDATE "InventoryItems" SET "CustomerId" = %s;', (customer1_id,))
            cur_wms.execute('UPDATE "InboundReceipts" SET "CustomerId" = %s;', (customer1_id,))
            cur_wms.execute('UPDATE "InboundReceiptLines" SET "CustomerId" = %s;', (customer1_id,))
            cur_wms.execute('UPDATE "OutboundOrders" SET "CustomerId" = %s;', (customer1_id,))
            conn_wms.commit()
            print("Updated customer1 Inventory and Orders in WMS database.")

        # 1.2 Insert SKUs to OMS and WMS Db
        print("Seeding SKU Catalog to erp_skus in WMS and OMS...")
        for sku in SKUS:
            sku_id = str(uuid.uuid4())
            erp_sku_id = f"erp-{sku['SkuCode']}"
            
            # Insert to WMS erp_skus
            cur_wms.execute("""
                INSERT INTO "erp_skus" ("Id", "TenantId", "ErpSkuId", "SkuCode", "Name", "UnitOfMeasure", "Status", "UpdatedAtErp", "SyncedAt")
                VALUES (%s, %s, %s, %s, %s, %s, 'active', NOW(), NOW())
                ON CONFLICT ("TenantId", "SkuCode") DO NOTHING;
            """, (sku_id, TENANT_ID, erp_sku_id, sku['SkuCode'], sku['Name'], sku['Unit']))

            # Insert to OMS erp_skus
            cur_oms.execute("""
                INSERT INTO "erp_skus" ("Id", "TenantId", "ErpSkuId", "SkuCode", "Name", "UnitOfMeasure", "Status", "UpdatedAtErp", "SyncedAt")
                VALUES (%s, %s, %s, %s, %s, %s, 'active', NOW(), NOW())
                ON CONFLICT ("TenantId", "SkuCode") DO NOTHING;
            """, (sku_id, TENANT_ID, erp_sku_id, sku['SkuCode'], sku['Name'], sku['Unit']))

        conn_wms.commit()
        conn_oms.commit()
        print(f"Successfully seeded {len(SKUS)} SKUs in WMS and OMS erp_skus tables.")

        # 1.3 Insert Partners in MasterData
        print("Seeding Partners (Consignors, Carriers, Consignees) in MasterData...")
        
        # Consignors (Type 2)
        consignors = [
            ("Lazada Trading", "P-CON-001"),
            ("Tiki Trading Official", "P-CON-002"),
            ("TikTokShop Global", "P-CON-003"),
            ("Coolmate Brand", "P-CON-004"),
            ("Ananas Store", "P-CON-005"),
            ("Decathlon Store", "P-CON-006"),
            ("Unilever Store", "P-CON-007"),
            ("Xiaomi Vietnam", "P-CON-008"),
        ]
        for name, code in consignors:
            cur_master.execute("""
                INSERT INTO "Partners" ("Id", "TenantId", "Code", "Name", "Type", "Phone", "IsActive", "CreatedAt")
                VALUES (%s, %s, %s, %s, 2, '090111222', true, NOW())
                ON CONFLICT ("TenantId", "Code") DO NOTHING;
            """, (str(uuid.uuid4()), TENANT_ID, code, name))

        # Carriers (Type 3)
        carriers = [
            ("Giao Hàng Nhanh (GHN)", "P-CAR-001"),
            ("Giao Hàng Tiết Kiệm (GHTK)", "P-CAR-002"),
            ("Viettel Post", "P-CAR-003"),
            ("Ninja Van Vietnam", "P-CAR-004"),
            ("GrabExpress Delivery", "P-CAR-005"),
        ]
        for name, code in carriers:
            cur_master.execute("""
                INSERT INTO "Partners" ("Id", "TenantId", "Code", "Name", "Type", "Phone", "IsActive", "CreatedAt")
                VALUES (%s, %s, %s, %s, 3, '19001234', true, NOW())
                ON CONFLICT ("TenantId", "Code") DO NOTHING;
            """, (str(uuid.uuid4()), TENANT_ID, code, name))

        # Consignees (Type 1 - 100+ random entities)
        first_names = ["Nguyễn", "Trần", "Lê", "Phạm", "Vũ", "Hoàng", "Phan", "Huỳnh", "Đặng", "Bùi", "Đỗ", "Hồ"]
        mid_names = ["Văn", "Thị", "Minh", "Hoàng", "Hữu", "Đức", "Khánh", "Ngọc", "Anh", "Quốc", "Duy"]
        last_names = ["Anh", "Bảo", "Cường", "Dũng", "Đạt", "Giang", "Hải", "Hùng", "Huy", "Khoa", "Linh", "Nam", "Phong", "Quân", "Sơn", "Tuấn", "Vy", "Yến"]
        
        streets = ["Nguyễn Huệ", "Lê Lợi", "Trần Hưng Đạo", "Huỳnh Tấn Phát", "Cách Mạng Tháng 8", "Nguyễn Trãi", "Điện Biên Phủ", "Hai Bà Trưng", "Lê Duẩn", "Nguyễn Chí Thanh"]
        cities = [
            ("Hồ Chí Minh", 10.762622, 106.660172),
            ("Hà Nội", 21.028511, 105.804817),
            ("Đà Nẵng", 16.054407, 108.202164),
            ("Cần Thơ", 10.037110, 105.788250),
            ("Hải Phòng", 20.844912, 106.688079),
            ("Nha Trang", 12.238791, 109.196749),
            ("Vinh", 18.673470, 105.681290)
        ]

        print("Generating 100 random consignees in MasterData...")
        for i in range(1, 105):
            name = f"{random.choice(first_names)} {random.choice(mid_names)} {random.choice(last_names)}"
            code = f"CUST-{i:03d}"
            phone = f"09{random.choice([0,1,3,5,7,8,9])}{random.randint(1000000, 9999999)}"
            city, lat, lng = random.choice(cities)
            street = f"{random.randint(1, 499)} {random.choice(streets)}"
            
            cur_master.execute("""
                INSERT INTO "Partners" ("Id", "TenantId", "Code", "Name", "Type", "Phone", "Address", "City", "Latitude", "Longitude", "IsActive", "CreatedAt")
                VALUES (%s, %s, %s, %s, 1, %s, %s, %s, %s, %s, true, NOW())
                ON CONFLICT ("TenantId", "Code") DO NOTHING;
            """, (str(uuid.uuid4()), TENANT_ID, code, name, phone, street, city, lat, lng))

        conn_master.commit()
        print("Successfully seeded all Partners in MasterData.")
        print("Phase 1 seeding completed successfully!")
        
    except Exception as e:
        print(f"Error seeding Phase 1: {e}")
        conn_wms.rollback()
        conn_master.rollback()
        conn_oms.rollback()
    finally:
        cur_wms.close()
        conn_wms.close()
        cur_master.close()
        conn_master.close()
        cur_oms.close()
        conn_oms.close()

def seed_phase_2():
    print("\n=== STARTING PHASE 2: Warehouse Layouts ===")
    conn_wms = psycopg2.connect(DB_WMS)
    cur_wms = conn_wms.cursor()
    
    try:
        # Get all warehouses
        cur_wms.execute('SELECT "Id", "Code", "Name" FROM "Warehouses";')
        warehouses = cur_wms.fetchall()
        print(f"Found {len(warehouses)} warehouses to configure layout.")

        for wh_id, wh_code, wh_name in warehouses:
            print(f"\nConfiguring layout for warehouse: {wh_name} ({wh_code})...")
            
            # 1. Blocks
            cur_wms.execute('SELECT "Id", "BlockCode" FROM "Blocks" WHERE "WarehouseId" = %s;', (wh_id,))
            existing_blocks = {row[1]: row[0] for row in cur_wms.fetchall()}
            
            blocks_to_seed = ["BLK-A", "BLK-BULK", "BLK-STAGING"]
            for blk_code in blocks_to_seed:
                if blk_code not in existing_blocks:
                    blk_id = str(uuid.uuid4())
                    cur_wms.execute("""
                        INSERT INTO "Blocks" ("Id", "WarehouseId", "BlockCode", "IsDeleted")
                        VALUES (%s, %s, %s, false);
                    """, (blk_id, wh_id, blk_code))
                    existing_blocks[blk_code] = blk_id
                    print(f"  Created Block: {blk_code}")
            
            # 2. Zones
            zones_by_type = {}
            for blk_code, blk_id in existing_blocks.items():
                cur_wms.execute('SELECT "Id", "ZoneType" FROM "Zones" WHERE "BlockId" = %s;', (blk_id,))
                existing_zones = {row[1]: row[0] for row in cur_wms.fetchall()}
                
                # Determine target zone type for this block
                if blk_code == "BLK-A":
                    target_zone = "Picking"
                elif blk_code == "BLK-BULK":
                    target_zone = "Storage"
                else: # BLK-STAGING
                    target_zone = "Staging"
                    
                if target_zone not in existing_zones:
                    zone_id = str(uuid.uuid4())
                    cur_wms.execute("""
                        INSERT INTO "Zones" ("Id", "BlockId", "ZoneType", "IsDeleted")
                        VALUES (%s, %s, %s, false);
                    """, (zone_id, blk_id, target_zone))
                    zones_by_type[target_zone] = zone_id
                    print(f"  Created Zone: {target_zone} in {blk_code}")
                else:
                    zones_by_type[target_zone] = existing_zones[target_zone]
            
            # 3. Bins
            cur_wms.execute('SELECT "Id", "BinCode" FROM "Bins" WHERE "WarehouseId" = %s;', (wh_id,))
            existing_bins = {row[1]: row[0] for row in cur_wms.fetchall()}
            
            bins_count = 0
            pick_seq = 1
            
            # Picking Zone Bins (BIN-A1-01 to BIN-A1-15)
            picking_zone_id = zones_by_type.get("Picking")
            if picking_zone_id:
                for i in range(1, 16):
                    bin_code = f"BIN-A1-{i:02d}"
                    if bin_code not in existing_bins:
                        bin_id = str(uuid.uuid4())
                        cur_wms.execute("""
                            INSERT INTO "Bins" ("Id", "WarehouseId", "ZoneId", "BinCode", "Status", "Version", "IsDeleted", "Aisle", "Rack", "Shelf", "PickSequence")
                            VALUES (%s, %s, %s, %s, 'Available', 1, false, 'A', '1', %s, %s);
                        """, (bin_id, wh_id, picking_zone_id, bin_code, f"{i:02d}", pick_seq))
                        pick_seq += 1
                        bins_count += 1
                        
            # Storage Zone Bins (BIN-BULK-01 to BIN-BULK-10)
            storage_zone_id = zones_by_type.get("Storage")
            if storage_zone_id:
                for i in range(1, 11):
                    bin_code = f"BIN-BULK-{i:02d}"
                    if bin_code not in existing_bins:
                        bin_id = str(uuid.uuid4())
                        cur_wms.execute("""
                            INSERT INTO "Bins" ("Id", "WarehouseId", "ZoneId", "BinCode", "Status", "Version", "IsDeleted", "Aisle", "Rack", "Shelf", "PickSequence")
                            VALUES (%s, %s, %s, %s, 'Available', 1, false, 'BULK', '1', %s, %s);
                        """, (bin_id, wh_id, storage_zone_id, bin_code, f"{i:02d}", pick_seq))
                        pick_seq += 1
                        bins_count += 1
                        
            # Staging Zone Bins
            staging_zone_id = zones_by_type.get("Staging")
            if staging_zone_id:
                special_bins = [
                    ("BIN-DOCK-01", "DOCK", "1", "01"),
                    ("BIN-STAGING-OUT-01", "STG-OUT", "1", "01"),
                    ("BIN-RETURN", "RET", "1", "1"),
                    ("BIN-SCRAP", "SCR", "1", "1")
                ]
                for bin_code, aisle, rack, shelf in special_bins:
                    if bin_code not in existing_bins:
                        bin_id = str(uuid.uuid4())
                        cur_wms.execute("""
                            INSERT INTO "Bins" ("Id", "WarehouseId", "ZoneId", "BinCode", "Status", "Version", "IsDeleted", "Aisle", "Rack", "Shelf", "PickSequence")
                            VALUES (%s, %s, %s, %s, 'Available', 1, false, %s, %s, %s, %s);
                        """, (bin_id, wh_id, staging_zone_id, bin_code, aisle, rack, shelf, pick_seq))
                        pick_seq += 1
                        bins_count += 1
            
            if bins_count > 0:
                print(f"  Successfully seeded {bins_count} new bins.")
            else:
                print("  All bins already configured.")
                
        conn_wms.commit()
        print("\nPhase 2 seeding completed successfully!")
        
    except Exception as e:
        print(f"Error seeding Phase 2: {e}")
        conn_wms.rollback()
    finally:
        cur_wms.close()
        conn_wms.close()

def update_bin_occupancy_statuses(cur_wms):
    print("Updating WMS Bins occupancy statuses based on physical inventory...")
    try:
        # Reset all bins to 'Available' first
        cur_wms.execute('UPDATE "Bins" SET "Status" = \'Available\';')
        
        # Get all bins that contain inventory
        cur_wms.execute('SELECT DISTINCT "BinId" FROM "InventoryItems" WHERE "QuantityOnHand" > 0;')
        occupied_bin_ids = [str(row[0]) for row in cur_wms.fetchall() if row[0] is not None]
        
        print(f"Found {len(occupied_bin_ids)} bins containing physical inventory.")
        if occupied_bin_ids:
            random.shuffle(occupied_bin_ids)
            # 10% to Full, rest to Occupied
            num_full = int(len(occupied_bin_ids) * 0.10)
            full_bins = occupied_bin_ids[:num_full]
            occupied_bins = occupied_bin_ids[num_full:]
            
            if occupied_bins:
                if len(occupied_bins) == 1:
                    cur_wms.execute('UPDATE "Bins" SET "Status" = \'Occupied\' WHERE "Id" = %s;', (occupied_bins[0],))
                else:
                    cur_wms.execute('UPDATE "Bins" SET "Status" = \'Occupied\' WHERE "Id" IN %s;', (tuple(occupied_bins),))
            if full_bins:
                if len(full_bins) == 1:
                    cur_wms.execute('UPDATE "Bins" SET "Status" = \'Full\' WHERE "Id" = %s;', (full_bins[0],))
                else:
                    cur_wms.execute('UPDATE "Bins" SET "Status" = \'Full\' WHERE "Id" IN %s;', (tuple(full_bins),))
            print(f"  Successfully updated bin statuses: {len(occupied_bins)} marked 'Occupied', {len(full_bins)} marked 'Full'.")
    except Exception as e:
        print(f"  Error updating bin statuses: {e}")

def seed_phase_3():
    print("\n=== STARTING PHASE 3: Inbound Logistics & Inventory ===")
    conn_wms = psycopg2.connect(DB_WMS)
    cur_wms = conn_wms.cursor()
    
    conn_master = psycopg2.connect(DB_MASTER)
    cur_master = conn_master.cursor()
    
    try:
        # 1. Retrieve required reference data
        # Warehouses
        cur_wms.execute('SELECT "Id", "Code" FROM "Warehouses";')
        warehouses = cur_wms.fetchall()
        wh_ids = [row[0] for row in warehouses]
        wh_map = {row[1]: row[0] for row in warehouses}
        
        # Consignors from MasterData
        cur_master.execute('SELECT "Code" FROM "Partners" WHERE "Type" = 2;')
        consignor_codes = [row[0] for row in cur_master.fetchall()]
        if not consignor_codes:
            # Fallback if Phase 1 was skipped
            consignor_codes = ["P-CON-001", "P-CON-002", "P-CON-003", "P-CON-004", "P-CON-005"]
            
        # SKUs from WMS erp_skus
        cur_wms.execute('SELECT "SkuCode" FROM "erp_skus";')
        skus = [row[0] for row in cur_wms.fetchall()]
        
        # Bins per warehouse
        cur_wms.execute('''
            SELECT "Id", "WarehouseId", "BinCode" 
            FROM "Bins" 
            WHERE "IsDeleted" = false 
              AND "BinCode" NOT LIKE 'BIN-DOCK%' 
              AND "BinCode" NOT LIKE 'BIN-STAGING%' 
              AND "BinCode" NOT LIKE 'BIN-RETURN' 
              AND "BinCode" NOT LIKE 'BIN-SCRAP' 
              AND "BinCode" NOT LIKE 'WALL%';
        ''')
        bins_by_wh = {}
        for bin_id, wh_id, bin_code in cur_wms.fetchall():
            if wh_id not in bins_by_wh:
                bins_by_wh[wh_id] = []
            bins_by_wh[wh_id].append((bin_id, bin_code))
            
        # Staging bins per warehouse (dock bins for inbound)
        cur_wms.execute('SELECT "Id", "WarehouseId" FROM "Bins" WHERE "BinCode" = \'BIN-DOCK-01\' AND "IsDeleted" = false;')
        dock_bins = {row[1]: row[0] for row in cur_wms.fetchall()}
        
        # Operators from WMS
        cur_wms.execute('SELECT "OperatorSub" FROM operator_profiles WHERE "IsActive" = true;')
        operators = [row[0] for row in cur_wms.fetchall()]
        if not operators:
            operators = ["125e2596-ad32-4f17-b6c3-f02af6eb503d"] # default admin sub
            
        print(f"Loaded reference data: {len(wh_ids)} Warehouses, {len(consignor_codes)} Consignors, {len(skus)} SKUs, {len(operators)} Operators.")

        # 2. Seed baseline InventoryItems & Ledgers
        print("Generating baseline InventoryItems (Physical Stock) & Ledgers...")
        inv_count = 0
        ledger_count = 0
        
        for wh_id in wh_ids:
            wh_bins = bins_by_wh.get(wh_id, [])
            if not wh_bins:
                continue
                
            # Pick a subset of SKUs (e.g. 35 random SKUs out of 50) to store in this warehouse
            selected_skus = random.sample(skus, min(len(skus), 35))
            
            for sku in selected_skus:
                # Store this SKU in 1 to 2 different bins in this warehouse
                num_bins = random.randint(1, 2)
                target_bins = random.sample(wh_bins, min(len(wh_bins), num_bins))
                
                for bin_id, bin_code in target_bins:
                    # Pick a random consignor
                    consignor = random.choice(consignor_codes)
                    qty = random.randint(50, 450)
                    lot_no = f"LOT-{datetime.now().year}-{random.randint(1, 6):02d}"
                    expiry_date = datetime.now() + timedelta(days=random.randint(180, 720))
                    last_restocked = datetime.now() - timedelta(days=random.randint(1, 90))
                    
                    inv_id = str(uuid.uuid4())
                    
                    # Insert InventoryItem
                    cur_wms.execute("""
                        INSERT INTO "InventoryItems" ("Id", "TenantId", "CustomerId", "WarehouseId", "BinId", "Sku", "LotNo", "ExpiryDate", "QuantityOnHand", "ReservedQty", "LastRestockedAt", "Version")
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 0, %s, 1)
                        ON CONFLICT ("TenantId", "WarehouseId", "Sku", "BinId", "LotNo") DO NOTHING;
                    """, (inv_id, TENANT_ID, consignor, wh_id, bin_id, sku, lot_no, expiry_date, qty, last_restocked))
                    
                    # If inserted
                    if cur_wms.rowcount > 0:
                        inv_count += 1
                        
                        # Create matching ledger entry
                        ledger_id = str(uuid.uuid4())
                        op_sub = random.choice(operators)
                        cur_wms.execute("""
                            INSERT INTO "InventoryLedgers" ("Id", "InventoryItemId", "Sku", "WarehouseId", "BinId", "LotNo", "ExpiryDate", "Reason", "DeltaQty", "BalanceAfter", "ReferenceId", "ReferenceType", "OperatorSub", "OccurredAt")
                            VALUES (%s, %s, %s, %s, %s, %s, %s, 1, %s, %s, %s, %s, %s, %s);
                        """, (ledger_id, inv_id, sku, wh_id, bin_id, lot_no, expiry_date, qty, qty, f"INIT-{str(wh_id).replace('-', '')[:8].upper()}", "InitialLoad", op_sub, last_restocked))
                        ledger_count += 1
                        
        print(f"  Successfully seeded {inv_count} InventoryItems and {ledger_count} Ledgers.")

        # 3. Seed historical Inbound Receipts & Putaway Tasks
        print("Generating historical Inbound Receipts & completed Putaway Tasks...")
        receipt_count = 0
        line_count = 0
        putaway_count = 0
        discrepancy_count = 0
        
        # We want to seed about 120 historical receipts spread over the past 90 days
        for i in range(1, 121):
            receipt_id = str(uuid.uuid4())
            order_id = str(uuid.uuid4())
            wh_id = random.choice(wh_ids)
            wh_code = [code for code, uid in wh_map.items() if uid == wh_id][0]
            
            # Select consignor
            consignor = random.choice(consignor_codes)
            
            created_at = datetime.now() - timedelta(days=random.randint(2, 90), hours=random.randint(0, 23), minutes=random.randint(0, 59))
            received_at = created_at + timedelta(hours=random.randint(1, 5), minutes=random.randint(0, 59))
            
            receipt_no = f"REC-{wh_code}-{created_at.strftime('%Y%m%d')}-{i:03d}"
            op_sub = random.choice(operators)
            
            # 5% completed with exceptions, 95% standard received
            status = "Received"
            if random.random() < 0.05:
                status = "CompletedWithExceptions"
                
            cur_wms.execute("""
                INSERT INTO "InboundReceipts" ("Id", "TenantId", "CustomerId", "WarehouseId", "ReceiptNo", "CreatedAt", "SourceShipmentNo", "OrderId", "Status", "ReceivedAt", "IsDeleted", "CreatedByOperatorId")
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, false, %s)
                ON CONFLICT DO NOTHING;
            """, (receipt_id, TENANT_ID, consignor, wh_id, receipt_no, created_at, f"SHIP-{i:04d}", order_id, status, received_at, op_sub))
            
            if cur_wms.rowcount > 0:
                receipt_count += 1
                
                # Add 1 to 3 lines
                num_lines = random.randint(1, 3)
                receipt_skus = random.sample(skus, num_lines)
                
                wh_bins = bins_by_wh.get(wh_id, [])
                dock_bin_id = dock_bins.get(wh_id)
                
                if not wh_bins or not dock_bin_id:
                    continue
                    
                for sku in receipt_skus:
                    expected_qty = random.randint(20, 150)
                    received_qty = expected_qty
                    
                    # Simulate discrepancy
                    if status == "CompletedWithExceptions":
                        received_qty = int(expected_qty * random.choice([0.8, 0.9, 0.95]))
                        if received_qty == expected_qty:
                            received_qty -= 2
                            
                    lot_no = f"LOT-{created_at.strftime('%Y-%m')}"
                    expiry_date = created_at + timedelta(days=365)
                    
                    line_id = str(uuid.uuid4())
                    
                    cur_wms.execute("""
                        INSERT INTO "InboundReceiptLines" ("Id", "ReceiptId", "TenantId", "CustomerId", "Sku", "ExpectedQuantity", "ReceivedQuantity", "LotNo", "ExpiryDate", "IsDeleted")
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, false)
                        ON CONFLICT ("ReceiptId", "Sku") WHERE "IsDeleted" = false DO NOTHING;
                    """, (line_id, receipt_id, TENANT_ID, consignor, sku, expected_qty, received_qty, lot_no, expiry_date))
                    line_count += 1
                    
                    # Pick a target bin
                    target_bin_id, target_bin_code = random.choice(wh_bins)
                    
                    # Create completed PutawayTask
                    putaway_id = str(uuid.uuid4())
                    task_created = received_at + timedelta(minutes=random.randint(10, 30))
                    task_started = task_created + timedelta(minutes=random.randint(5, 15))
                    task_completed = task_started + timedelta(minutes=random.randint(2, 10))
                    putaway_op = random.choice(operators)
                    
                    cur_wms.execute("""
                        INSERT INTO "PutawayTasks" ("Id", "TenantId", "WarehouseId", "ReceiptId", "Sku", "LotNo", "Quantity", "SourceBinId", "SuggestedBinId", "ActualBinId", "Status", "OperatorId", "CreatedAt", "StartedAt", "CompletedAt")
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'Completed', %s, %s, %s, %s);
                    """, (putaway_id, TENANT_ID, wh_id, receipt_id, sku, lot_no, received_qty, dock_bin_id, target_bin_id, target_bin_id, putaway_op, task_created, task_started, task_completed))
                    putaway_count += 1
                    
                    # Create Inbound Discrepancy
                    if received_qty < expected_qty:
                        disc_id = str(uuid.uuid4())
                        cur_wms.execute("""
                            INSERT INTO "InboundDiscrepancies" ("Id", "ReceiptId", "WarehouseId", "Sku", "ExpectedQty", "ReceivedQty", "DiscrepancyQty", "OperatorId", "Status", "CreatedAt", "Notes")
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 1, %s, 'Missing or damaged items in unloading area');
                        """, (disc_id, receipt_id, wh_id, sku, expected_qty, received_qty, expected_qty - received_qty, putaway_op, task_completed))
                        discrepancy_count += 1
                        
        update_bin_occupancy_statuses(cur_wms)
        conn_wms.commit()
        print(f"  Successfully seeded {receipt_count} InboundReceipts, {line_count} Lines, {putaway_count} PutawayTasks, and {discrepancy_count} Discrepancies.")
        print("Phase 3 seeding completed successfully!")
        
    except Exception as e:
        print(f"Error seeding Phase 3: {e}")
        conn_wms.rollback()
    finally:
        cur_wms.close()
        conn_wms.close()
        cur_master.close()
        conn_master.close()

def seed_phase_4():
    print("\n=== STARTING PHASE 4: Outbound Logistics ===")
    
    conn_wms = psycopg2.connect(DB_WMS)
    cur_wms = conn_wms.cursor()
    
    conn_oms = psycopg2.connect(DB_OMS)
    cur_oms = conn_oms.cursor()
    
    conn_master = psycopg2.connect(DB_MASTER)
    cur_master = conn_master.cursor()
    
    try:
        # Check if we already have a large number of orders
        cur_oms.execute('SELECT COUNT(*) FROM "Orders";')
        existing_orders_count = cur_oms.fetchone()[0]
        print(f"Existing orders in OMS: {existing_orders_count}")
        if existing_orders_count >= 1500:
            print("OMS already has 1500+ orders. Skipping Phase 4 seeding to prevent duplication.")
            return

        # 1. Retrieve required reference data
        # Warehouses
        cur_wms.execute('SELECT "Id", "Code" FROM "Warehouses";')
        warehouses = cur_wms.fetchall()
        wh_ids = [row[0] for row in warehouses]
        wh_map = {row[1]: row[0] for row in warehouses}
        
        # Consignees (Type 1) from MasterData
        cur_master.execute('SELECT "Code", "Name", "Phone", "Address", "City", "Latitude", "Longitude" FROM "Partners" WHERE "Type" = 1;')
        consignees = cur_master.fetchall()
        if not consignees:
            print("Error: No consignees found. Please run Phase 1 first.")
            return
            
        # SKUs from WMS erp_skus
        cur_wms.execute('SELECT "SkuCode", "Id" FROM "erp_skus";')
        skus_data = cur_wms.fetchall()
        skus = [row[0] for row in skus_data]
        sku_code_to_id = {row[0]: row[1] for row in skus_data}
        
        # Operators from WMS
        cur_wms.execute('SELECT "OperatorSub" FROM operator_profiles WHERE "IsActive" = true;')
        operators = [row[0] for row in cur_wms.fetchall()]
        if not operators:
            operators = ["125e2596-ad32-4f17-b6c3-f02af6eb503d"] # default admin sub
            
        # Customer ID (sub for customer1 / Shopee)
        cur_wms.execute('SELECT "CustomerId" FROM "OutboundOrders" WHERE "CustomerId" IS NOT NULL LIMIT 1;')
        row = cur_wms.fetchone()
        if row:
            customer_id = row[0]
        else:
            cur_oms.execute('SELECT "CustomerId" FROM "Orders" WHERE "CustomerId" IS NOT NULL LIMIT 1;')
            row = cur_oms.fetchone()
            if row:
                customer_id = row[0]
            else:
                customer_id = "b779b279-02a6-4b44-83d4-5c162c505df5" # default fallback
        print(f"Using Customer ID (Shopee Sub): {customer_id}")

        # Bins per warehouse
        cur_wms.execute('''
            SELECT "Id", "WarehouseId", "BinCode" 
            FROM "Bins" 
            WHERE "IsDeleted" = false 
              AND "BinCode" NOT LIKE 'BIN-DOCK%' 
              AND "BinCode" NOT LIKE 'BIN-STAGING%' 
              AND "BinCode" NOT LIKE 'BIN-RETURN' 
              AND "BinCode" NOT LIKE 'BIN-SCRAP' 
              AND "BinCode" NOT LIKE 'WALL%';
        ''')
        bins_by_wh = {}
        for bin_id, wh_id, bin_code in cur_wms.fetchall():
            wh_id_str = str(wh_id)
            if wh_id_str not in bins_by_wh:
                bins_by_wh[wh_id_str] = []
            bins_by_wh[wh_id_str].append((str(bin_id), bin_code))

        # Retrieve current WMS physical inventory to allocate from
        cur_wms.execute('SELECT "Id", "WarehouseId", "Sku", "BinId", "QuantityOnHand", "ReservedQty" FROM "InventoryItems";')
        inv_items = cur_wms.fetchall()
        inventory_pool = {}
        for inv_id, wh_id, sku, bin_id, qty_on_hand, reserved_qty in inv_items:
            key = (str(wh_id), sku)
            if key not in inventory_pool:
                inventory_pool[key] = []
            inventory_pool[key].append({
                "Id": str(inv_id),
                "BinId": str(bin_id),
                "Qty": qty_on_hand,
                "Reserved": reserved_qty
            })

        # Generate 3000 orders
        total_orders = 3000
        completed_count = int(total_orders * 0.85)
        cancelled_count = int(total_orders * 0.05)
        delivering_count = int(total_orders * 0.05)
        in_warehouse_count = int(total_orders * 0.03)
        new_count = total_orders - completed_count - cancelled_count - delivering_count - in_warehouse_count
        
        print(f"Generating orders: {completed_count} Completed, {cancelled_count} Cancelled, {delivering_count} Delivering, {in_warehouse_count} InWarehouse, {new_count} New")
        
        order_specs = []
        
        def random_date(start_days, end_days):
            days_ago = random.uniform(start_days, end_days)
            return datetime.now() - timedelta(days=days_ago)

        for _ in range(completed_count):
            order_specs.append(('Completed', random_date(2, 90)))
        for _ in range(cancelled_count):
            order_specs.append(('Cancelled', random_date(1, 90)))
        for _ in range(delivering_count):
            order_specs.append(('Delivering', random_date(0.1, 3)))
        for _ in range(in_warehouse_count):
            order_specs.append(('InWarehouse', random_date(0.1, 2)))
        for _ in range(new_count):
            order_specs.append(('New', random_date(0.01, 1)))

        random.shuffle(order_specs)

        oms_orders = []
        oms_items = []
        oms_history = []
        
        wms_orders = []
        wms_order_lines = []
        wms_pick_tasks = []
        wms_reservations = []
        
        inventory_updates = []
        new_inventory_items = []
        
        picking_orders_by_wh = {}
        
        def get_status_flow(final_status):
            if final_status == 'New':
                return ['New']
            elif final_status == 'InWarehouse':
                return ['New', 'Confirmed', 'AwaitingPickup', 'PickedUp', 'InWarehouse']
            elif final_status == 'Delivering':
                return ['New', 'Confirmed', 'AwaitingPickup', 'PickedUp', 'InWarehouse', 'Delivering']
            elif final_status == 'Completed':
                return ['New', 'Confirmed', 'AwaitingPickup', 'PickedUp', 'InWarehouse', 'Delivering', 'Delivered', 'Completed']
            elif final_status == 'Cancelled':
                return ['New', 'Confirmed', 'Cancelled']
            else:
                return ['New']

        for idx, (status, created_at) in enumerate(order_specs, start=1):
            order_id = str(uuid.uuid4())
            waybill_code = f"LMSWAY9{idx:07d}"
            wh_id = random.choice(wh_ids)
            wh_id_str = str(wh_id)
            
            c_code, c_name, c_phone, c_address, c_city, c_lat, c_lng = random.choice(consignees)
            
            num_skus = random.randint(1, 3)
            selected_skus = random.sample(skus, num_skus)
            
            cod_amount = Decimal(random.choice([0, 0, 0, 150000, 250000, 500000, 1200000]))
            shipping_fee = Decimal(random.randint(20000, 45000))
            weight = Decimal(f"{random.uniform(0.2, 5.0):.2f}")
            note = random.choice([None, "Gọi trước khi giao", "Giao giờ hành chính", "Giao hàng nhanh", "Không đồng kiểm"])
            
            delivery_driver = None
            pickup_driver = None
            route_id = None
            if status in ('Delivering', 'Completed'):
                delivery_driver = f"driver-{random.randint(1, 10)}"
                pickup_driver = f"driver-{random.randint(1, 10)}"
                route_id = f"route-{random.randint(1, 5)}"
                
            delivery_attempts = 0
            if status == 'Completed':
                delivery_attempts = 1
            elif status == 'Delivering' and random.random() < 0.2:
                delivery_attempts = 1
                
            oms_orders.append((
                order_id, customer_id, status, c_address, c_city, c_city[:3].upper(), 'VN', '70000',
                created_at, created_at + timedelta(hours=random.randint(1, 24)) if status != 'New' else None,
                cod_amount, c_name, c_phone, delivery_attempts, delivery_driver, wh_id_str,
                None, note, pickup_driver, None, route_id, shipping_fee, wh_id_str,
                waybill_code, weight, TENANT_ID, customer_id, None,
                None, None, c_code, c_lat, c_lng, 1, 1
            ))
            
            wms_lines = []
            for sku_code in selected_skus:
                sku_uuid = sku_code_to_id[sku_code]
                qty = random.randint(1, 4)
                price = Decimal(random.randint(50, 400) * 1000)
                
                item_id = str(uuid.uuid4())
                oms_items.append((
                    item_id, order_id, sku_uuid, qty, price, sku_code
                ))
                
                reserved_qty = 0
                picked_qty = 0
                packed_qty = 0
                shipped_qty = 0
                
                if status == 'Completed' or status == 'Delivering':
                    reserved_qty = qty
                    picked_qty = qty
                    packed_qty = qty
                    shipped_qty = qty
                
                wms_lines.append({
                    "Sku": sku_code,
                    "Qty": qty,
                    "Reserved": reserved_qty,
                    "Picked": picked_qty,
                    "Packed": packed_qty,
                    "Shipped": shipped_qty
                })
                
            wms_status = 2
            if status == 'New':
                wms_status = 2
            elif status == 'Cancelled':
                wms_status = 13
            elif status == 'Delivering':
                wms_status = 11
            elif status == 'Completed':
                wms_status = 12
            elif status == 'InWarehouse':
                r_val = random.random()
                if r_val < 0.3:
                    wms_status = 4
                elif r_val < 0.7:
                    wms_status = 5
                else:
                    wms_status = 9
                    
            if status == 'InWarehouse':
                for line in wms_lines:
                    if wms_status == 4:
                        line["Reserved"] = line["Qty"]
                    elif wms_status == 5:
                        line["Reserved"] = line["Qty"]
                        if random.random() < 0.5:
                            line["Picked"] = line["Qty"]
                    elif wms_status == 9:
                        line["Reserved"] = line["Qty"]
                        line["Picked"] = line["Qty"]
                        line["Packed"] = line["Qty"]

            priority = 0
            if status in ('New', 'InWarehouse') and random.random() < 0.05:
                priority = 1
                
            wms_orders.append((
                order_id, TENANT_ID, customer_id, wh_id_str, order_id,
                c_city, wms_status, None, created_at, True,
                c_address, c_city, waybill_code, priority, c_code,
                c_lat, c_lng, weight * Decimal('0.003'), weight, None
            ))
            
            for line in wms_lines:
                line_id = str(uuid.uuid4())
                wms_order_lines.append((
                    line_id, order_id, line["Sku"], 'PCS', line["Qty"],
                    line["Reserved"], line["Picked"], line["Packed"], line["Shipped"]
                ))
                
                need_pick_task = wms_status in (4, 5, 9, 11, 12)
                need_reservation = wms_status in (4, 5, 9)
                
                if need_pick_task or need_reservation:
                    sku_code = line["Sku"]
                    qty = line["Qty"]
                    
                    inv_pool_key = (wh_id_str, sku_code)
                    bin_id = None
                    inv_item_id = None
                    
                    found_pool = False
                    if inv_pool_key in inventory_pool and inventory_pool[inv_pool_key]:
                        inv_rec = inventory_pool[inv_pool_key][0]
                        bin_id = inv_rec["BinId"]
                        inv_item_id = inv_rec["Id"]
                        found_pool = True
                    else:
                        wh_bins = bins_by_wh.get(wh_id_str, [])
                        if wh_bins:
                            bin_id, _ = random.choice(wh_bins)
                        else:
                            continue
                            
                        inv_item_id = str(uuid.uuid4())
                        new_inv_qty = qty + random.randint(100, 200)
                        
                        new_inventory_items.append((
                            inv_item_id, TENANT_ID, customer_id, wh_id_str, str(bin_id), sku_code,
                            f"LOT-{created_at.strftime('%Y%m')}", created_at + timedelta(days=365),
                            new_inv_qty, 0, created_at, 1
                        ))
                        if inv_pool_key not in inventory_pool:
                            inventory_pool[inv_pool_key] = []
                        inventory_pool[inv_pool_key].append({
                            "Id": inv_item_id,
                            "BinId": bin_id,
                            "Qty": new_inv_qty,
                            "Reserved": 0
                        })
                        inv_rec = inventory_pool[inv_pool_key][0]
                        found_pool = True

                    if need_reservation and inv_item_id:
                        res_id = str(uuid.uuid4())
                        wms_reservations.append((
                            res_id, inv_item_id, order_id, 1, qty, 1,
                            created_at + timedelta(days=7), None, created_at
                        ))
                        inv_rec["Reserved"] += qty
                        if inv_rec["Qty"] < inv_rec["Reserved"]:
                            added_qty = inv_rec["Reserved"] - inv_rec["Qty"] + 100
                            inv_rec["Qty"] += added_qty
                            inventory_updates.append((inv_rec["Qty"], inv_rec["Reserved"], inv_rec["Id"]))
                        else:
                            inventory_updates.append((inv_rec["Qty"], inv_rec["Reserved"], inv_rec["Id"]))
                            
                    if need_pick_task and bin_id:
                        pick_id = str(uuid.uuid4())
                        p_status = 1
                        p_op = None
                        p_started = None
                        p_picked = None
                        
                        if wms_status == 5:
                            p_status = random.choice([1, 2])
                            if p_status == 2:
                                p_op = random.choice(operators)
                                p_started = created_at + timedelta(minutes=random.randint(5, 30))
                        elif wms_status in (9, 11, 12):
                            p_status = 3
                            p_op = random.choice(operators)
                            p_started = created_at + timedelta(minutes=random.randint(5, 30))
                            p_picked = p_started + timedelta(minutes=random.randint(2, 15))
                            
                        wms_pick_tasks.append((
                            pick_id, line_id, str(bin_id), qty, p_status, p_op,
                            p_picked, created_at, None, None, None, p_started
                        ))
                        
                        if wms_status == 5:
                            if wh_id_str not in picking_orders_by_wh:
                                picking_orders_by_wh[wh_id_str] = []
                            picking_orders_by_wh[wh_id_str].append({
                                "order_id": order_id,
                                "pick_task_idx": len(wms_pick_tasks) - 1
                            })
                            
            status_flow = get_status_flow(status)
            current_time = created_at
            
            for step_idx, step_status in enumerate(status_flow):
                history_id = str(uuid.uuid4())
                status_from = 'None' if step_idx == 0 else status_flow[step_idx - 1]
                
                if step_idx > 0:
                    if step_status == 'Confirmed':
                        current_time += timedelta(minutes=random.randint(5, 20))
                    elif step_status == 'AwaitingPickup':
                        current_time += timedelta(minutes=random.randint(5, 15))
                    elif step_status == 'PickedUp':
                        current_time += timedelta(hours=random.randint(1, 4))
                    elif step_status == 'InWarehouse':
                        current_time += timedelta(hours=random.randint(2, 6))
                    elif step_status == 'Delivering':
                        current_time += timedelta(hours=random.randint(4, 12))
                    elif step_status == 'Delivered':
                        current_time += timedelta(hours=random.randint(2, 8))
                    elif step_status == 'Completed':
                        current_time += timedelta(hours=random.randint(12, 36))
                    elif step_status == 'Cancelled':
                        current_time += timedelta(minutes=random.randint(15, 60))
                        
                step_op = None
                step_source = 'System'
                if step_status in ('PickedUp', 'InWarehouse', 'Delivering', 'Delivered'):
                    step_op = random.choice(operators)
                    step_source = 'Operator'
                    
                oms_history.append((
                    history_id, order_id, TENANT_ID, status_from, step_status, current_time,
                    step_source, step_op, None, None
                ))

        print("Grouping picking tasks into Waves...")
        waves_to_insert = []
        for wh_id_str, orders_list in picking_orders_by_wh.items():
            chunk_size = random.randint(5, 8)
            for chunk_idx, i in enumerate(range(0, len(orders_list), chunk_size)):
                chunk = orders_list[i:i+chunk_size]
                wave_id = str(uuid.uuid4())
                wave_no = f"WV-{wh_id_str.replace('-', '')[:4].upper()}-{datetime.now().strftime('%m%d')}-{chunk_idx+1:03d}"
                
                waves_to_insert.append((
                    wave_id, wave_no, wh_id_str, 2, len(chunk), 2, datetime.now()
                ))
                
                for item in chunk:
                    task_idx = item["pick_task_idx"]
                    task_list = list(wms_pick_tasks[task_idx])
                    task_list[8] = wave_id
                    wms_pick_tasks[task_idx] = tuple(task_list)

        print(f"Inserting {len(oms_orders)} OMS Orders...")
        cur_oms.executemany("""
            INSERT INTO "Orders" (
                "Id", "ConsignorId", "Status", "Consignee_Address_Street", "Consignee_Address_City", 
                "Consignee_Address_State", "Consignee_Address_Country", "Consignee_Address_ZipCode", 
                "CreatedAt", "LastModifiedAt", "CodAmount", "Consignee_FullName", "Consignee_Phone", 
                "DeliveryAttempts", "DeliveryDriverId", "DestinationWarehouseId", "FailureReason", 
                "Note", "PickupDriverId", "ProofOfDeliveryUrl", "RouteId", "ShippingFee", "WarehouseId", 
                "WaybillCode", "Weight", "TenantId", "CustomerId", "ExternalReference", 
                "CreatedByOperatorId", "UpdatedByOperatorId", "Consignee_PartnerId", 
                "Consignee_Latitude", "Consignee_Longitude", "Fulfillment", "Type"
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            ) ON CONFLICT ("WaybillCode") DO NOTHING;
        """, oms_orders)
        
        print(f"Inserting {len(oms_items)} OMS OrderItems...")
        cur_oms.executemany("""
            INSERT INTO "OrderItems" (
                "Id", "OrderId", "Sku", "Quantity", "Price", "SkuCode"
            ) VALUES (
                %s, %s, %s, %s, %s, %s
            ) ON CONFLICT DO NOTHING;
        """, oms_items)
        
        print(f"Inserting {len(oms_history)} OMS OrderStatusHistories...")
        cur_oms.executemany("""
            INSERT INTO "OrderStatusHistories" (
                "Id", "OrderId", "TenantId", "StatusFrom", "StatusTo", "ChangedAtUtc", "Source", "ChangedByOperatorId", "CorrelationId", "Reason"
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            ) ON CONFLICT DO NOTHING;
        """, oms_history)
        
        conn_oms.commit()
        print("OMS database changes committed successfully!")

        print(f"Inserting {len(new_inventory_items)} new physical inventory items...")
        if new_inventory_items:
            cur_wms.executemany("""
                INSERT INTO "InventoryItems" (
                    "Id", "TenantId", "CustomerId", "WarehouseId", "BinId", "Sku", "LotNo", "ExpiryDate", "QuantityOnHand", "ReservedQty", "LastRestockedAt", "Version"
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                ) ON CONFLICT DO NOTHING;
            """, new_inventory_items)

        print(f"Updating WMS InventoryItem quantities and reservations counts...")
        if inventory_updates:
            dedup_updates = {}
            for qty_oh, res_qty, inv_id in inventory_updates:
                dedup_updates[inv_id] = (qty_oh, res_qty)
                
            update_data = [(v[0], v[1], k) for k, v in dedup_updates.items()]
            cur_wms.executemany("""
                UPDATE "InventoryItems" 
                SET "QuantityOnHand" = %s, "ReservedQty" = %s
                WHERE "Id" = %s;
            """, update_data)

        print(f"Inserting {len(wms_orders)} WMS OutboundOrders...")
        cur_wms.executemany("""
            INSERT INTO "OutboundOrders" (
                "Id", "TenantId", "CustomerId", "WarehouseId", "OrderId", "Destination", "Status", "PlannedShipAt", "CreatedAt", "AllowPartial", "DestinationAddress", "DestinationCity", "OrderNo", "Priority", "PartnerId", "Latitude", "Longitude", "Volume", "Weight", "CreatedByOperatorId"
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            ) ON CONFLICT ("Id") DO NOTHING;
        """, wms_orders)

        print(f"Inserting {len(wms_order_lines)} WMS OutboundOrderLines...")
        cur_wms.executemany("""
            INSERT INTO "OutboundOrderLines" (
                "Id", "OutboundOrderId", "Sku", "Uom", "RequestedQty", "ReservedQty", "PickedQty", "PackedQty", "ShippedQty"
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s
            ) ON CONFLICT ("OutboundOrderId", "Sku") DO NOTHING;
        """, wms_order_lines)

        print(f"Inserting {len(waves_to_insert)} WMS Waves...")
        if waves_to_insert:
            cur_wms.executemany("""
                INSERT INTO "Waves" (
                    "Id", "WaveNo", "WarehouseId", "Type", "OrderCount", "Status", "CreatedAt"
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s
                ) ON CONFLICT DO NOTHING;
            """, waves_to_insert)

        print(f"Inserting {len(wms_pick_tasks)} WMS PickTasks...")
        cur_wms.executemany("""
            INSERT INTO "PickTasks" (
                "Id", "OutboundOrderLineId", "FromBinId", "Quantity", "Status", "AssignedOperatorId", "PickedAt", "CreatedAt", "WaveId", "PutToWallAt", "TargetCubbyBinCode", "StartedAt"
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            ) ON CONFLICT DO NOTHING;
        """, wms_pick_tasks)

        print(f"Inserting {len(wms_reservations)} WMS Inventory Reservations...")
        if wms_reservations:
            cur_wms.executemany("""
                INSERT INTO inventory_reservations (
                    "Id", "InventoryItemId", "ReferenceId", "ReferenceType", "Quantity", "Status", "ExpiresAt", "CorrelationId", "CreatedAt"
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s
                ) ON CONFLICT DO NOTHING;
            """, wms_reservations)

        update_bin_occupancy_statuses(cur_wms)
        conn_wms.commit()
        print("WMS database changes committed successfully!")
        print("Phase 4 seeding completed successfully!")

    except Exception as e:
        print(f"Error seeding Phase 4: {e}")
        import traceback
        traceback.print_exc()
        conn_wms.rollback()
        conn_oms.rollback()
    finally:
        cur_wms.close()
        conn_wms.close()
        cur_oms.close()
        conn_oms.close()
        cur_master.close()
        conn_master.close()


def seed_phase_5():
    print("\n=== STARTING PHASE 5: Operator Activity & SLA Logs ===")
    conn_wms = psycopg2.connect(DB_WMS)
    cur_wms = conn_wms.cursor()
    
    try:
        # Check if we already have a large number of logs
        cur_wms.execute('SELECT COUNT(*) FROM "OperatorActivityLogs";')
        existing_logs_count = cur_wms.fetchone()[0]
        print(f"Existing operator activity logs in WMS: {existing_logs_count}")
        if existing_logs_count >= 5000:
            print("WMS already has 5000+ activity logs. Skipping Phase 5 seeding to prevent duplication.")
            return

        # 1. Retrieve baseline reference data
        # Operators
        cur_wms.execute('SELECT "OperatorSub" FROM operator_profiles WHERE "IsActive" = true;')
        operators = [row[0] for row in cur_wms.fetchall()]
        if not operators:
            operators = ["125e2596-ad32-4f17-b6c3-f02af6eb503d"] # default admin sub
            
        # Warehouses
        cur_wms.execute('SELECT "Id" FROM "Warehouses";')
        warehouses = [str(row[0]) for row in cur_wms.fetchall()]
        if not warehouses:
            print("Error: No warehouses found. Please run Phase 1 first.")
            return
            
        # SKUs
        cur_wms.execute('SELECT "SkuCode" FROM "erp_skus";')
        skus = [row[0] for row in cur_wms.fetchall()]
        if not skus:
            skus = ["SKU-APP-001", "SKU-ELE-001", "SKU-FAB-001", "SKU-COS-001"] # fallback
            
        print(f"Loaded reference data: {len(operators)} Operators, {len(warehouses)} Warehouses, {len(skus)} SKUs.")

        activity_logs = []

        # 2. Extract completed PutawayTasks
        print("Extracting completed Putaway Tasks...")
        cur_wms.execute("""
            SELECT "Id", "WarehouseId", "OperatorId", "Sku", "Quantity", "StartedAt", "CompletedAt"
            FROM "PutawayTasks"
            WHERE "Status" = 'Completed' AND "StartedAt" IS NOT NULL AND "CompletedAt" IS NOT NULL;
        """)
        putaway_tasks = cur_wms.fetchall()
        print(f"Found {len(putaway_tasks)} completed Putaway Tasks.")
        
        for task_id, wh_id, op_id, sku, qty, started_at, completed_at in putaway_tasks:
            duration = (completed_at - started_at).total_seconds()
            log_id = str(uuid.uuid4())
            activity_logs.append((
                log_id, TENANT_ID, str(wh_id), op_id or random.choice(operators),
                'Putaway', str(task_id), sku, qty, started_at, completed_at, duration
            ))

        # 3. Extract completed PickTasks
        print("Extracting completed Pick Tasks...")
        cur_wms.execute("""
            SELECT pt."Id", o."WarehouseId", pt."AssignedOperatorId", ol."Sku", pt."Quantity", pt."StartedAt", pt."PickedAt"
            FROM "PickTasks" pt
            JOIN "OutboundOrderLines" ol ON pt."OutboundOrderLineId" = ol."Id"
            JOIN "OutboundOrders" o ON ol."OutboundOrderId" = o."Id"
            WHERE pt."Status" = 3 AND pt."StartedAt" IS NOT NULL AND pt."PickedAt" IS NOT NULL;
        """)
        pick_tasks = cur_wms.fetchall()
        print(f"Found {len(pick_tasks)} completed Pick Tasks.")
        
        for task_id, wh_id, op_id, sku, qty, started_at, picked_at in pick_tasks:
            duration = (picked_at - started_at).total_seconds()
            log_id = str(uuid.uuid4())
            activity_logs.append((
                log_id, TENANT_ID, str(wh_id), op_id or random.choice(operators),
                'Pick', str(task_id), sku, qty, started_at, picked_at, duration
            ))

        # 4. Generate background activity logs to reach 11,000+ total
        target_total = 11000
        current_seeded = len(activity_logs)
        to_generate = target_total - current_seeded
        print(f"Generating {to_generate} additional background logs for SLA metrics...")

        # Timeframe: last 90 days
        for i in range(to_generate):
            log_id = str(uuid.uuid4())
            wh_id = random.choice(warehouses)
            op_id = random.choice(operators)
            sku = random.choice(skus)
            qty = random.randint(1, 24)
            
            task_type = random.choice(['Pick', 'Putaway', 'Replenish', 'Count'])
            
            days_ago = random.uniform(0.1, 90.0)
            completed_at = datetime.now() - timedelta(days=days_ago)
            
            if task_type == 'Pick':
                base_duration = random.randint(30, 150)
            elif task_type == 'Putaway':
                base_duration = random.randint(60, 240)
            elif task_type == 'Replenish':
                base_duration = random.randint(180, 720)
            else: # Count
                base_duration = random.randint(120, 900)
                
            is_violation = random.random() < 0.12
            if is_violation:
                duration = int(base_duration * random.uniform(1.6, 3.5))
            else:
                duration = base_duration
                
            started_at = completed_at - timedelta(seconds=duration)
            
            activity_logs.append((
                log_id, TENANT_ID, wh_id, op_id,
                task_type, str(uuid.uuid4()), sku, qty, started_at, completed_at, float(duration)
            ))

        # 5. Bulk insert
        print(f"Bulk inserting {len(activity_logs)} activity logs into OperatorActivityLogs...")
        cur_wms.executemany("""
            INSERT INTO "OperatorActivityLogs" (
                "Id", "TenantId", "WarehouseId", "OperatorId", "TaskType", "TaskId", "Sku", "Quantity", "StartedAt", "CompletedAt", "DurationSeconds"
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            ) ON CONFLICT DO NOTHING;
        """, activity_logs)
        
        conn_wms.commit()
        print("WMS OperatorActivityLogs changes committed successfully!")
        print("Phase 5 seeding completed successfully!")

    except Exception as e:
        print(f"Error seeding Phase 5: {e}")
        import traceback
        traceback.print_exc()
        conn_wms.rollback()
    finally:
        cur_wms.close()
        conn_wms.close()

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Multi-Phase Large Dataset Seeding Script")
    parser.add_argument('--phase', type=str, default='all', choices=['1', '2', '3', '4', '5', 'all'],
                        help="The phase of seeding to run (1 to 5, or all)")
    args = parser.parse_args()

    if args.phase == '1':
        seed_phase_1()
    elif args.phase == '2':
        seed_phase_2()
    elif args.phase == '3':
        seed_phase_3()
    elif args.phase == '4':
        seed_phase_4()
    elif args.phase == '5':
        seed_phase_5()
    else:
        seed_phase_1()
        seed_phase_2()
        seed_phase_3()
        seed_phase_4()
        seed_phase_5()
        print("\nAll seeding phases completed.")
