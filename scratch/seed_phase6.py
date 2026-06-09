import psycopg2
import psycopg2.extras
import uuid
import requests
from datetime import datetime, timedelta
import random

# DB Connections
DB_MASTER = "dbname=lms_master_dev user=postgres password=postgres host=127.0.0.1 port=56432"
DB_OMS = "dbname=lms_oms_dev user=postgres password=postgres host=127.0.0.1 port=56432"
DB_WMS = "dbname=lms_wms_dev user=postgres password=postgres host=127.0.0.1 port=56432"

KC_URL = 'http://127.0.0.1:18080'
ADMIN_USER = 'admin'
ADMIN_PASS = 'admin'
REALM = 'logistics_realm'

def get_kc_token():
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

def seed_phase_6():
    print("Starting Phase 6 Seeding...")
    token = get_kc_token()
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }

    print("1. Creating Keycloak accounts for Consignees...")
    conn_master = psycopg2.connect(DB_MASTER)
    cur_master = conn_master.cursor()
    cur_master.execute("SELECT \"Id\", \"Name\", \"Phone\" FROM \"Partners\" WHERE \"Type\" = 1")
    consignees = cur_master.fetchall()

    created_users = 0
    for cid, name, phone in consignees:
        username = f"customer_{phone}" if phone else f"customer_{cid[:8]}"
        email_str = f"{username}@test.com"
        
        user_payload = {
            "username": username,
            "email": email_str,
            "firstName": name.split(' ')[0] if name else "",
            "lastName": " ".join(name.split(' ')[1:]) if name else "",
            "enabled": True,
            "credentials": [{"type": "password", "value": "1", "temporary": False}]
        }
        res = requests.post(f"{KC_URL}/admin/realms/{REALM}/users", json=user_payload, headers=headers)
        if res.status_code == 201:
            created_users += 1

    print(f"   Created {created_users} Keycloak customer accounts.")
    cur_master.close()
    conn_master.close()

    print("2. Backfilling OrderConsignees in OMS...")
    conn_oms = psycopg2.connect(DB_OMS)
    cur_oms = conn_oms.cursor()
    cur_oms.execute("""
        SELECT \"Id\", \"Consignee_PartnerId\", \"Consignee_FullName\", \"Consignee_Phone\",
               \"Consignee_Address_Street\", \"Consignee_Address_City\", \"Consignee_Address_State\", 
               \"Consignee_Address_Country\", \"Consignee_Address_ZipCode\", \"Consignee_Latitude\", \"Consignee_Longitude\"
        FROM \"Orders\"
    """)
    orders = cur_oms.fetchall()
    
    order_consignees = []
    for order in orders:
        order_consignees.append((
            order[0], # OrderId
            order[2], # FullName
            order[3], # Phone
            order[4], # Street
            order[5], # City
            order[6], # State
            order[7], # Country
            order[8], # ZipCode
            order[9], # Latitude
            order[10], # Longitude
            datetime.utcnow() # CreatedAt
        ))
    
    psycopg2.extras.execute_batch(cur_oms, """
        INSERT INTO \"OrderConsignees\" (
            \"OrderId\", \"FullName\", \"Phone\",
            \"Street\", \"City\", \"State\", \"Country\", \"ZipCode\", 
            \"Latitude\", \"Longitude\", \"CreatedAt\"
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT DO NOTHING
    """, order_consignees)
    conn_oms.commit()
    print(f"   Backfilled {len(order_consignees)} OrderConsignees.")

    print("3. Seeding Packing and Shipping in WMS...")
    conn_wms = psycopg2.connect(DB_WMS)
    cur_wms = conn_wms.cursor()
    
    # Get 70% of Picked OutboundOrders
    cur_wms.execute("""
        SELECT \"Id\", \"TenantId\", \"OrderId\", \"WarehouseId\"
        FROM \"OutboundOrders\"
        WHERE \"Status\" >= 4 -- Picked or higher
    """)
    picked_orders = cur_wms.fetchall()
    random.shuffle(picked_orders)
    
    target_count = int(len(picked_orders) * 0.7)
    orders_to_ship = picked_orders[:target_count]
    print(f"   Selected {len(orders_to_ship)} OutboundOrders for Shipping.")

    # Get Carriers
    cur_wms.execute("SELECT \"Id\" FROM \"Roles\"") # Actually we need Carriers from MasterData or we can just mock carrier name
    # We will use mock carrier strings
    carriers = ["GHTK", "ViettelPost", "AhaMove", "NinjaVan", "ShopeeExpress"]

    now = datetime.utcnow()
    shipments = []
    shipment_orders = []
    shipment_items = []
    
    packed_order_ids = []
    shipped_oms_order_ids = []

    for idx, (ob_id, tenant_id, oms_order_id, wms_id) in enumerate(orders_to_ship):
        packed_order_ids.append(ob_id)
        shipped_oms_order_ids.append(oms_order_id)
        
        # 1. Update lines to packed
        cur_wms.execute("""
            UPDATE \"OutboundOrderLines\" 
            SET \"PackedQty\" = \"PickedQty\" 
            WHERE \"OutboundOrderId\" = %s
            RETURNING \"Id\", \"PackedQty\"
        """, (ob_id,))
        lines = cur_wms.fetchall()
        
        # 2. Create Shipment for every ~5 orders, or 1 shipment per order for simplicity.
        # Let's group them slightly: 3 orders per shipment
        if idx % 3 == 0:
            shipment_id = str(uuid.uuid4())
            shipment_no = f"SHP-{now.strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"
            carrier = random.choice(carriers)
            # Create Shipment
            shipments.append((
                shipment_id, tenant_id, "cust-1", shipment_no, wms_id, 
                1, "Dest-1", carrier, f"TRK-{random.randint(100000, 999999)}",
                4, # Shipped
                now - timedelta(hours=random.randint(1, 24)),
                now
            ))
            
        # Add ShipmentOrder
        ship_order_id = str(uuid.uuid4())
        shipment_orders.append((ship_order_id, shipment_id, ob_id))
        
        # Add ShipmentItems
        for line_id, qty in lines:
            ship_item_id = str(uuid.uuid4())
            shipment_items.append((ship_item_id, shipment_id, line_id, qty))

    # Update OutboundOrders status
    if packed_order_ids:
        cur_wms.execute("""
            UPDATE \"OutboundOrders\"
            SET \"Status\" = 6 -- Shipped
            WHERE \"Id\" = ANY(%s::uuid[])
        """, (packed_order_ids,))
        
        # Insert Shipments
        psycopg2.extras.execute_batch(cur_wms, """
            INSERT INTO \"Shipments\" (
                \"Id\", \"TenantId\", \"CustomerId\", \"ShipmentNo\", \"WarehouseId\", 
                \"DestinationType\", \"DestinationId\", \"Carrier\", \"TrackingNo\", 
                \"Status\", \"CreatedAt\", \"ShippedAt\"
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT DO NOTHING
        """, shipments)
        
        psycopg2.extras.execute_batch(cur_wms, """
            INSERT INTO \"ShipmentOrders\" (\"Id\", \"ShipmentId\", \"OutboundOrderId\")
            VALUES (%s, %s, %s)
            ON CONFLICT DO NOTHING
        """, shipment_orders)
        
        psycopg2.extras.execute_batch(cur_wms, """
            INSERT INTO \"ShipmentItems\" (\"Id\", \"ShipmentId\", \"OutboundOrderLineId\", \"Quantity\")
            VALUES (%s, %s, %s, %s)
            ON CONFLICT DO NOTHING
        """, shipment_items)

    conn_wms.commit()
    print(f"   Created {len(shipments)} Shipments containing {len(shipment_orders)} Orders and {len(shipment_items)} Items.")
    cur_wms.close()
    conn_wms.close()

    print("4. Updating OMS Orders status to Shipped...")
    # Update OMS Orders
    if shipped_oms_order_ids:
        # Filter only existing orders
        cur_oms.execute("SELECT \"Id\" FROM \"Orders\" WHERE \"Id\" = ANY(%s::uuid[])", (shipped_oms_order_ids,))
        existing_orders = {str(row[0]) for row in cur_oms.fetchall()}
        valid_oms_order_ids = [oid for oid in shipped_oms_order_ids if str(oid) in existing_orders]
        
        if valid_oms_order_ids:
            cur_oms.execute("""
                UPDATE \"Orders\"
                SET \"Status\" = 5 -- Shipped
                WHERE \"Id\" = ANY(%s::uuid[])
            """, (valid_oms_order_ids,))
            
            # Insert OrderStatusHistories
            histories = []
            for oid in valid_oms_order_ids:
                histories.append((
                    str(uuid.uuid4()),
                    oid,
                    'default-tenant',
                    'Picked',
                    'Shipped',
                    now,
                    'system',
                    None,
                    None,
                    str(uuid.uuid4()) # correlationId
                ))
            
        psycopg2.extras.execute_batch(cur_oms, """
            INSERT INTO \"OrderStatusHistories\" (
                \"Id\", \"OrderId\", \"TenantId\", \"StatusFrom\", \"StatusTo\",
                \"ChangedAtUtc\", \"Source\", \"Reason\", \"ChangedByOperatorId\", \"CorrelationId\"
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT DO NOTHING
        """, histories)

    conn_oms.commit()
    print(f"   Updated {len(shipped_oms_order_ids)} Orders in OMS to Shipped.")
    cur_oms.close()
    conn_oms.close()

    print("Phase 6 Seeding Completed!")

if __name__ == '__main__':
    seed_phase_6()
