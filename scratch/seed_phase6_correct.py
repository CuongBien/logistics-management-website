import psycopg2
import psycopg2.extras
import uuid
import requests
from datetime import datetime, timedelta
import random
import math
import sys

# Force UTF-8 stdout
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# DB Connections
DB_MASTER = "dbname=lms_master_dev user=postgres password=postgres host=127.0.0.1 port=56432"
DB_OMS = "dbname=lms_oms_dev user=postgres password=postgres host=127.0.0.1 port=56432"
DB_WMS = "dbname=lms_wms_dev user=postgres password=postgres host=127.0.0.1 port=56432"

KC_URL = 'http://127.0.0.1:18080'
ADMIN_USER = 'admin'
ADMIN_PASS = 'admin'
REALM = 'logistics_realm'

WarehouseCoords = {
    "WH-CT-001": (10.037110, 105.788250),
    "WH-SG-002": (10.762622, 106.660172),
    "WH-NT-003": (12.238791, 109.196749),
    "WH-DN-004": (16.054407, 108.202164),
    "WH-V-005": (18.673470, 105.681290),
    "WH-HN-006": (21.028511, 105.804817),
    "WH-HP-007": (20.844912, 106.688079)
}

CITY_TO_WH_CODE = {
    'Cần Thơ': 'WH-CT-001',
    'Hồ Chí Minh': 'WH-SG-002',
    'Nha Trang': 'WH-NT-003',
    'Đà Nẵng': 'WH-DN-004',
    'Vinh': 'WH-V-005',
    'Hà Nội': 'WH-HN-006',
    'Hải Phòng': 'WH-HP-007',
}

def calculate_distance(lat1, lon1, lat2, lon2):
    EarthRadiusKm = 6371.0
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = math.sin(dLat / 2) * math.sin(dLat / 2) + \
        math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * \
        math.sin(dLon / 2) * math.sin(dLon / 2)
    c = 2 * math.asin(min(1.0, math.sqrt(a)))
    return EarthRadiusKm * c

def find_dest_warehouse(partner_id, city, warehouses):
    for w in warehouses:
        if w['Code'] == partner_id:
            return w
            
    if city in CITY_TO_WH_CODE:
        wh_code = CITY_TO_WH_CODE[city]
        for w in warehouses:
            if w['Code'] == wh_code:
                return w
                
    # Accent insensitive substring match
    import unicodedata
    def strip_accents(s):
        return ''.join(c for c in unicodedata.normalize('NFD', s)
                      if unicodedata.category(c) != 'Mn')
                      
    if city:
        city_norm = strip_accents(city).lower()
        for w in warehouses:
            name_norm = strip_accents(w['Name']).lower()
            code_norm = strip_accents(w['Code']).lower()
            if city_norm in name_norm or city_norm in code_norm:
                return w
                
    return None

def get_destination_key(order, warehouses, routes):
    dest_key = order['PartnerId'] or order['DestinationCity'] or order['DestinationAddress'] or "UNKNOWN"
    dest_wh = find_dest_warehouse(order['PartnerId'], order['DestinationCity'], warehouses)
    
    source_wh = next((w for w in warehouses if w['Id'] == order['WarehouseId']), None)
    
    if dest_wh and source_wh:
        route = routes.get((source_wh['Id'], dest_wh['Id']))
        if route:
            dest_key = str(route['NextHopWarehouseId'])
            
    return dest_key

def get_transport_rules(order, warehouses):
    transport_mode = "Truck_1_5T"
    max_weight_kg = 1500.0
    max_volume_cbm = 4.5
    
    source_wh = next((w for w in warehouses if w['Id'] == order['WarehouseId']), None)
    
    if order['Latitude'] is not None and order['Longitude'] is not None and source_wh is not None:
        source_lat = source_wh['Latitude']
        source_lon = source_wh['Longitude']
        
        if source_lat is None or source_lon is None:
            coords = WarehouseCoords.get(source_wh['Code'])
            if coords is not None:
                source_lat, source_lon = coords
                
        if source_lat and source_lon:
            distance_km = calculate_distance(source_lat, source_lon, order['Latitude'], order['Longitude'])
            
            if distance_km <= 2.5:
                transport_mode = "Motorbike"
                max_weight_kg = 50.0
                max_volume_cbm = 0.2
            elif distance_km <= 15.0:
                transport_mode = "Truck_1_5T"
                max_weight_kg = 1500.0
                max_volume_cbm = 4.5
            elif distance_km <= 50.0:
                transport_mode = "Truck_8T"
                max_weight_kg = 8000.0
                max_volume_cbm = 24.0
            else:
                transport_mode = "Container"
                max_weight_kg = 25000.0
                max_volume_cbm = 68.0
                
    return transport_mode, max_weight_kg, max_volume_cbm

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
    print("Starting Phase 6 Seeding with Consolidation Algorithm...")
    try:
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

        print(f"   Created/verified {len(consignees)} Keycloak customer accounts (newly created: {created_users}).")
        cur_master.close()
        conn_master.close()
    except Exception as e:
        print("Keycloak error (ignored if already configured):", e)

    print("2. Backfilling OrderConsignees in OMS...")
    conn_oms = psycopg2.connect(DB_OMS)
    cur_oms = conn_oms.cursor()
    cur_oms.execute("""
        SELECT "Id", "Consignee_PartnerId", "Consignee_FullName", "Consignee_Phone",
               "Consignee_Address_Street", "Consignee_Address_City", "Consignee_Address_State", 
               "Consignee_Address_Country", "Consignee_Address_ZipCode", "Consignee_Latitude", "Consignee_Longitude"
        FROM "Orders"
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
        INSERT INTO "OrderConsignees" (
            "OrderId", "FullName", "Phone",
            "Street", "City", "State", "Country", "ZipCode", 
            "Latitude", "Longitude", "CreatedAt"
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT DO NOTHING
    """, order_consignees)
    conn_oms.commit()
    print(f"   Backfilled {len(order_consignees)} OrderConsignees.")

    print("3. Fetching Warehouse and Routes metadata...")
    conn_wms = psycopg2.connect(DB_WMS)
    cur_wms = conn_wms.cursor()

    cur_wms.execute('SELECT "Id", "Code", "Name", "Latitude", "Longitude" FROM "Warehouses" WHERE "IsDeleted" = false')
    warehouses = []
    for row in cur_wms.fetchall():
        warehouses.append({
            'Id': str(row[0]),
            'Code': row[1],
            'Name': row[2],
            'Latitude': row[3],
            'Longitude': row[4]
        })

    cur_wms.execute('SELECT "Id", "SourceWarehouseId", "DestinationWarehouseId", "NextHopWarehouseId" FROM "WarehouseRoutes"')
    routes = {}
    for row in cur_wms.fetchall():
        routes[(str(row[1]), str(row[2]))] = {
            'Id': str(row[0]),
            'SourceWarehouseId': str(row[1]),
            'DestinationWarehouseId': str(row[2]),
            'NextHopWarehouseId': str(row[3])
        }

    print("4. Fetching Outbound Orders for Shipping...")
    # Fetch all Shipped (11) and Delivered (12) orders
    cur_wms.execute("""
        SELECT "Id", "TenantId", "CustomerId", "WarehouseId", "OrderId", "PartnerId", 
               "DestinationCity", "DestinationAddress", "Latitude", "Longitude", "Weight", "Volume", "Status", "CreatedAt"
        FROM "OutboundOrders"
        WHERE "Status" IN (11, 12)
    """)
    shipped_and_delivered_orders = cur_wms.fetchall()

    # Fetch Packed (9) orders to ship 70% of them (chừa lại 30% Packed)
    cur_wms.execute("""
        SELECT "Id", "TenantId", "CustomerId", "WarehouseId", "OrderId", "PartnerId", 
               "DestinationCity", "DestinationAddress", "Latitude", "Longitude", "Weight", "Volume", "Status", "CreatedAt"
        FROM "OutboundOrders"
        WHERE "Status" = 9
    """)
    packed_orders = cur_wms.fetchall()
    
    random.shuffle(packed_orders)
    ship_packed_count = int(len(packed_orders) * 0.7)
    packed_orders_to_ship = packed_orders[:ship_packed_count]
    
    print(f"   Total Shipped(11)/Delivered(12) orders: {len(shipped_and_delivered_orders)}")
    print(f"   Total Packed(9) orders: {len(packed_orders)}. Shipping 70% ({ship_packed_count}) and leaving 30% ({len(packed_orders) - ship_packed_count}).")

    all_orders_to_ship = []
    orders_data = shipped_and_delivered_orders + packed_orders_to_ship
    
    for row in orders_data:
        all_orders_to_ship.append({
            'Id': str(row[0]),
            'TenantId': row[1],
            'CustomerId': row[2],
            'WarehouseId': str(row[3]),
            'OrderId': str(row[4]),
            'PartnerId': row[5],
            'DestinationCity': row[6],
            'DestinationAddress': row[7],
            'Latitude': row[8],
            'Longitude': row[9],
            'Weight': float(row[10] or 0),
            'Volume': float(row[11] or 0),
            'Status': int(row[12]),
            'CreatedAt': row[13]
        })

    # Fetch lines for all selected orders
    order_ids = [o['Id'] for o in all_orders_to_ship]
    order_lines = {}
    if order_ids:
        cur_wms.execute("""
            SELECT "Id", "OutboundOrderId", "Sku", "RequestedQty", "PickedQty", "PackedQty", "ShippedQty"
            FROM "OutboundOrderLines"
            WHERE "OutboundOrderId" = ANY(%s::uuid[])
        """, (order_ids,))
        for row in cur_wms.fetchall():
            o_id = str(row[1])
            if o_id not in order_lines:
                order_lines[o_id] = []
            order_lines[o_id].append({
                'Id': str(row[0]),
                'OutboundOrderId': o_id,
                'Sku': row[2],
                'RequestedQty': int(row[3]),
                'PickedQty': int(row[4]),
                'PackedQty': int(row[5]),
                'ShippedQty': int(row[6])
            })

    print("5. Consolidating orders into shipments based on algorithm...")
    carriers = ["GHTK", "ViettelPost", "AhaMove", "NinjaVan", "ShopeeExpress"]
    
    # We will build a list of shipments
    shipments_list = [] # List of dicts
    shipment_orders = [] # List of tuples
    shipment_items = [] # List of tuples
    
    packed_to_ship_ids = [str(o[0]) for o in packed_orders_to_ship]
    packed_to_ship_oms_ids = [str(o[4]) for o in packed_orders_to_ship]

    now = datetime.utcnow()

    # Loop through orders sorted by CreatedAt so we consolidate logically in order of time
    all_orders_to_ship.sort(key=lambda x: x['CreatedAt'])

    for order in all_orders_to_ship:
        dest_key = get_destination_key(order, warehouses, routes)
        transport_mode, max_weight_kg, max_volume_cbm = get_transport_rules(order, warehouses)
        
        # Calculate order weight and volume if not set
        weight = order['Weight']
        volume = order['Volume']
        if weight <= 0 and order['Id'] in order_lines:
            weight = sum((line['PickedQty'] or line['RequestedQty']) for line in order_lines[order['Id']]) * 1.2
            volume = weight * 0.003
            
        # Determine Shipment Status based on order status
        # If the order is Shipped(11) or Packed(9) (which will be shipped), shipment is Shipped(4)
        # If the order is Delivered(12), shipment is Delivered(6)
        target_shipment_status = 4 if order['Status'] in (9, 11) else 6

        # Find existing shipment that fits
        matched_shipment = None
        for s in shipments_list:
            if (s['WarehouseId'] == order['WarehouseId'] and 
                s['DestinationId'] == dest_key and 
                s['Status'] == target_shipment_status and
                s['TenantId'] == order['TenantId'] and
                s['CurrentWeight'] + weight <= max_weight_kg and
                s['CurrentVolume'] + volume <= max_volume_cbm):
                
                matched_shipment = s
                break
                
        if matched_shipment:
            matched_shipment['Orders'].append(order)
            matched_shipment['CurrentWeight'] += weight
            matched_shipment['CurrentVolume'] += volume
            print(f"Consolidated Order {order['Id'][:8]} into Shipment {matched_shipment['ShipmentNo']} ({transport_mode}). Current load: {matched_shipment['CurrentWeight']:.1f}kg/{matched_shipment['CurrentVolume']:.3f}CBM")
        else:
            # Create a new shipment
            shipment_id = str(uuid.uuid4())
            unique_part = uuid.uuid4().hex[:8].upper()
            shipment_no = f"SHP-{order['WarehouseId'][:8].upper()}-{order['CreatedAt'].strftime('%Y%m%d%H%M%S')}-{unique_part}"
            carrier = random.choice(carriers)
            tracking_no = f"TRK-{random.randint(10000000, 99999999)}"
            
            # Find RouteId matching the SourceWarehouseId and final DestinationWarehouseId
            dest_wh = find_dest_warehouse(order['PartnerId'], order['DestinationCity'], warehouses)
            route_id = None
            if dest_wh:
                route = routes.get((order['WarehouseId'], dest_wh['Id']))
                if route:
                    route_id = route['Id']
            
            # Determine DestinationType
            is_dest_wh = any(w['Id'] == dest_key for w in warehouses)
            dest_type = 0 if is_dest_wh else (1 if order['PartnerId'] is None else 2)
            
            new_shipment = {
                'Id': shipment_id,
                'TenantId': order['TenantId'],
                'CustomerId': order['CustomerId'],
                'ShipmentNo': shipment_no,
                'WarehouseId': order['WarehouseId'],
                'DestinationType': dest_type,
                'DestinationId': dest_key,
                'Carrier': carrier,
                'RouteId': route_id,
                'TrackingNo': tracking_no,
                'Status': target_shipment_status,
                'CreatedAt': order['CreatedAt'],
                'ShippedAt': order['CreatedAt'] + timedelta(minutes=random.randint(30, 180)),
                'CurrentWeight': weight,
                'CurrentVolume': volume,
                'Orders': [order]
            }
            shipments_list.append(new_shipment)
            print(f"Created new Shipment {shipment_no} for next hop {dest_key[:8]} ({transport_mode})")

    # Generate insert data for shipments, orders, and items
    shipments_db_data = []
    for s in shipments_list:
        shipments_db_data.append((
            s['Id'], s['TenantId'], s['CustomerId'], s['ShipmentNo'], s['WarehouseId'],
            s['DestinationType'], s['DestinationId'], s['Carrier'], s['RouteId'], s['TrackingNo'],
            s['Status'], s['CreatedAt'], s['ShippedAt']
        ))
        for order in s['Orders']:
            ship_order_id = str(uuid.uuid4())
            shipment_orders.append((ship_order_id, s['Id'], order['Id']))
            
            # Lines
            lines = order_lines.get(order['Id'], [])
            for line in lines:
                ship_item_id = str(uuid.uuid4())
                qty = line['PackedQty'] if line['PackedQty'] > 0 else line['RequestedQty']
                shipment_items.append((ship_item_id, s['Id'], line['Id'], qty))

    # Update new Shipped orders in WMS
    if packed_to_ship_ids:
        cur_wms.execute("""
            UPDATE "OutboundOrders"
            SET "Status" = 11 -- Shipped
            WHERE "Id" = ANY(%s::uuid[])
        """, (packed_to_ship_ids,))
        
        cur_wms.execute("""
            UPDATE "OutboundOrderLines"
            SET "ShippedQty" = "PackedQty"
            WHERE "OutboundOrderId" = ANY(%s::uuid[])
        """, (packed_to_ship_ids,))
        print(f"   Updated {len(packed_to_ship_ids)} Packed WMS orders to Shipped status.")

    # Bulk insert Shipment details
    if shipments_db_data:
        cur_wms.execute('DELETE FROM "ShipmentItems"')
        cur_wms.execute('DELETE FROM "ShipmentOrders"')
        cur_wms.execute('DELETE FROM "Shipments"')
        
        psycopg2.extras.execute_batch(cur_wms, """
            INSERT INTO "Shipments" (
                "Id", "TenantId", "CustomerId", "ShipmentNo", "WarehouseId", 
                "DestinationType", "DestinationId", "Carrier", "RouteId", "TrackingNo", 
                "Status", "CreatedAt", "ShippedAt"
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT DO NOTHING
        """, shipments_db_data)
        
        psycopg2.extras.execute_batch(cur_wms, """
            INSERT INTO "ShipmentOrders" ("Id", "ShipmentId", "OutboundOrderId")
            VALUES (%s, %s, %s)
            ON CONFLICT DO NOTHING
        """, shipment_orders)
        
        psycopg2.extras.execute_batch(cur_wms, """
            INSERT INTO "ShipmentItems" ("Id", "ShipmentId", "OutboundOrderLineId", "Quantity")
            VALUES (%s, %s, %s, %s)
            ON CONFLICT DO NOTHING
        """, shipment_items)

    conn_wms.commit()
    print(f"   WMS database: inserted {len(shipments_list)} Shipments, {len(shipment_orders)} ShipmentOrders, {len(shipment_items)} ShipmentItems.")

    print("6. Updating OMS Orders status to Delivering...")
    if packed_to_ship_oms_ids:
        cur_oms.execute("""
            UPDATE "Orders"
            SET "Status" = 'Delivering'
            WHERE "Id" = ANY(%s::uuid[])
        """, (packed_to_ship_oms_ids,))
        
        histories = []
        for oid in packed_to_ship_oms_ids:
            histories.append((
                str(uuid.uuid4()),
                oid,
                'default-tenant',
                'InWarehouse',
                'Delivering',
                now,
                'system',
                None,
                None,
                str(uuid.uuid4()) # correlationId
            ))
            
        psycopg2.extras.execute_batch(cur_oms, """
            INSERT INTO "OrderStatusHistories" (
                "Id", "OrderId", "TenantId", "StatusFrom", "StatusTo",
                "ChangedAtUtc", "Source", "Reason", "ChangedByOperatorId", "CorrelationId"
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT DO NOTHING
        """, histories)
        print(f"   OMS database: updated {len(packed_to_ship_oms_ids)} orders to Delivering and added status histories.")

    conn_oms.commit()
    
    cur_wms.close()
    conn_wms.close()
    cur_oms.close()
    conn_oms.close()
    
    print("Phase 6 Seeding Completed successfully with proper consolidation grouping!")

if __name__ == '__main__':
    seed_phase_6()
