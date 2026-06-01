import psycopg2
import uuid
from datetime import datetime, timezone

# Connect to database
conn = psycopg2.connect("dbname=lms_wms_dev user=postgres password=postgres host=127.0.0.1 port=56432")
cur = conn.cursor()

HCM_WAREHOUSE_ID = 'a3a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1'

# 1. Seed Orders for Wave Planning (Allocated state)
print("Seeding Orders for Wave Planning...")
for i in range(1, 4):
    order_id = str(uuid.uuid4())
    order_no = f"OUT-SEED-{i:03d}"
    
    cur.execute("""
        INSERT INTO "OutboundOrders" (
            "Id", "TenantId", "CustomerId", "WarehouseId", "OrderId", "OrderNo", 
            "Status", "Priority", "Volume", "Weight", "AllowPartial", "CreatedAt"
        )
        VALUES (%s, 'tenant-1', 'customer-1', %s, %s, %s, 3, 0, 0, 0, false, %s)
    """, (order_id, HCM_WAREHOUSE_ID, str(uuid.uuid4()), order_no, datetime.now(timezone.utc)))
    
    # 1 line for order 1, 2 lines for order 2, 3 lines for order 3
    for j in range(1, i+1):
        line_id = str(uuid.uuid4())
        sku = f"SKU-WAVE-{j}"
        cur.execute("""
            INSERT INTO "OutboundOrderLines" ("Id", "OutboundOrderId", "Sku", "RequestedQty", "ReservedQty", "PickedQty", "PackedQty", "ShippedQty", "Uom")
            VALUES (%s, %s, %s, 10, 10, 0, 0, 0, 'pcs')
        """, (line_id, order_id, sku))
        
        # We need an InventoryReservation for the line, otherwise AutoPlanWaves won't create PickTasks
        # Wait, AutoPlanWavesCommand checks InventoryReservations where ReferenceId = order_id and Sku = line.Sku
        res_id = str(uuid.uuid4())
        item_id = str(uuid.uuid4())
        # First create an InventoryItem for the reservation
        bin_id = 'b3b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1' # HCM ST-B-01
        cur.execute("""
            INSERT INTO "InventoryItems" ("Id", "Sku", "QuantityOnHand", "ReservedQty", "Version", "TenantId", "CustomerId", "WarehouseId", "BinId")
            VALUES (%s, %s, 100, 10, 1, 'tenant-1', 'customer-1', %s, %s)
        """, (item_id, sku, HCM_WAREHOUSE_ID, bin_id))
        
        cur.execute("""
            INSERT INTO "inventory_reservations" ("Id", "InventoryItemId", "Quantity", "ReferenceType", "ReferenceId", "Status", "CreatedAt", "ExpiresAt")
            VALUES (%s, %s, 10, 2, %s, 1, %s, %s)
        """, (res_id, item_id, order_id, datetime.now(timezone.utc), datetime.now(timezone.utc)))

# 2. Seed Returns for RTO Disposition
print("Seeding Outbound Returns...")
shipment_id = str(uuid.uuid4())
cur.execute("""
    INSERT INTO "Shipments" ("Id", "TenantId", "CustomerId", "ShipmentNo", "WarehouseId", "DestinationType", "DestinationId", "Status", "CreatedAt")
    VALUES (%s, 'tenant-1', 'customer-1', 'SHIP-RETURN-999', %s, 1, 'dest-1', 8, %s)
""", (shipment_id, HCM_WAREHOUSE_ID, datetime.now(timezone.utc)))

for k in range(1, 3):
    ret_id = str(uuid.uuid4())
    sku = f"SKU-RET-{k}"
    
    cur.execute("""
        INSERT INTO "OutboundReturns" ("Id", "TenantId", "CustomerId", "WarehouseId", "ShipmentId", "OrderNo", "Sku", "ReturnedQty", "Condition", "Disposition", "Notes", "CreatedAt")
        VALUES (%s, 'tenant-1', 'customer-1', %s, %s, 'OUT-RET-999', %s, 5, %s, 1, 'Test return', %s)
    """, (ret_id, HCM_WAREHOUSE_ID, shipment_id, sku, k, datetime.now(timezone.utc)))
    
    # We must put the items into BIN-RETURN
    item_id = str(uuid.uuid4())
    cur.execute("SELECT \"Id\" FROM \"Bins\" WHERE \"BinCode\" = 'BIN-RETURN' AND \"WarehouseId\" = %s", (HCM_WAREHOUSE_ID,))
    return_bin = cur.fetchone()
    if return_bin:
        cur.execute("""
            INSERT INTO "InventoryItems" ("Id", "Sku", "QuantityOnHand", "ReservedQty", "Version", "TenantId", "CustomerId", "WarehouseId", "BinId")
            VALUES (%s, %s, 5, 0, 1, 'tenant-1', 'customer-1', %s, %s)
        """, (item_id, sku, HCM_WAREHOUSE_ID, return_bin[0]))

conn.commit()
cur.close()
conn.close()
print("Seeding completed successfully.")
