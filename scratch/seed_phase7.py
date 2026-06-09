import psycopg2
import psycopg2.extras
import uuid
from datetime import datetime, timedelta
import random
import sys

# Force UTF-8 stdout
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# DB Connections
DB_WMS = "dbname=lms_wms_dev user=postgres password=postgres host=127.0.0.1 port=56432"

def seed_phase_7():
    print("Starting Phase 7 Seeding: Cycle Counting and Returns (RTO)...")
    conn = psycopg2.connect(DB_WMS)
    cur = conn.cursor()

    # Load Warehouses
    cur.execute('SELECT "Id", "Code" FROM "Warehouses" WHERE "IsDeleted" = false')
    warehouses = [{'Id': str(row[0]), 'Code': row[1]} for row in cur.fetchall()]
    print(f"Loaded {len(warehouses)} warehouses.")

    # Load Operators
    cur.execute('SELECT "OperatorSub" FROM operator_profiles WHERE "IsActive" = true')
    operators = [row[0] for row in cur.fetchall()]
    if not operators:
        operators = ["125e2596-ad32-4f17-b6c3-f02af6eb503d"]
    print(f"Loaded {len(operators)} operators.")

    # Load Bins per Warehouse
    cur.execute('SELECT "Id", "WarehouseId", "BinCode" FROM "Bins" WHERE "IsDeleted" = false')
    bins_by_wh = {}
    return_bins = {} # Mapping warehouseId -> BinId
    for row in cur.fetchall():
        bid, whid, code = str(row[0]), str(row[1]), row[2]
        if whid not in bins_by_wh:
            bins_by_wh[whid] = []
        bins_by_wh[whid].append({'Id': bid, 'Code': code})
        if code == 'BIN-RETURN':
            return_bins[whid] = bid

    # Ensure all warehouses have a BIN-RETURN bin
    for wh in warehouses:
        whid = wh['Id']
        if whid not in return_bins:
            # Create a return bin
            cur.execute('SELECT "Id" FROM "Zones" WHERE "WarehouseId" = %s LIMIT 1', (whid,))
            zone_row = cur.fetchone()
            if zone_row:
                zone_id = str(zone_row[0])
                bin_id = str(uuid.uuid4())
                cur.execute("""
                    INSERT INTO "Bins" ("Id", "ZoneId", "WarehouseId", "BinCode", "Status", "IsDeleted", "CapacityWeight", "CapacityVolume", "Length", "Width", "Height")
                    VALUES (%s, %s, %s, 'BIN-RETURN', 'Available', false, 1000, 10, 1, 1, 1)
                """, (bin_id, zone_id, whid))
                return_bins[whid] = bin_id
                print(f"   Created BIN-RETURN for warehouse {wh['Code']}.")
            else:
                print(f"   WARNING: Warehouse {wh['Code']} has no Zones. Cannot create BIN-RETURN.")

    # Load current InventoryItems
    cur.execute('SELECT "Id", "WarehouseId", "BinId", "Sku", "LotNo", "ExpiryDate", "QuantityOnHand" FROM "InventoryItems"')
    inventory_items = []
    for row in cur.fetchall():
        inventory_items.append({
            'Id': str(row[0]),
            'WarehouseId': str(row[1]),
            'BinId': str(row[2]),
            'Sku': row[3],
            'LotNo': row[4],
            'ExpiryDate': row[5],
            'QuantityOnHand': int(row[6])
        })
    print(f"Loaded {len(inventory_items)} inventory items.")

    print("\n1. Seeding Cycle Count Tasks & Reconciliation Reports...")
    count_tasks = []
    reconciliation_reports = []
    ledgers = []
    inventory_updates = [] # tuples: (new_qty, item_id)

    # We will generate ~25 tasks per warehouse (total ~225 tasks)
    random.seed(42)
    now = datetime.utcnow()

    # We will sample from inventory items to perform cycle counting on
    sampled_inventory = random.sample(inventory_items, min(180, len(inventory_items)))
    
    # Task distribution: 50% Adjusted, 30% Counted, 20% Pending
    task_count = 0
    for item in sampled_inventory:
        whid = item['WarehouseId']
        bid = item['BinId']
        sku = item['Sku']
        expected_qty = item['QuantityOnHand']
        
        # Decide status
        r = random.random()
        if r < 0.5:
            status = 2 # Adjusted
        elif r < 0.8:
            status = 1 # Counted
        else:
            status = 0 # Pending

        task_id = str(uuid.uuid4())
        operator = random.choice(operators)
        created_at = now - timedelta(days=random.randint(1, 30))
        started_at = created_at + timedelta(minutes=random.randint(5, 60)) if status in (1, 2) else None
        completed_at = started_at + timedelta(minutes=random.randint(10, 45)) if status in (1, 2) else None

        counted_qty = None
        if status in (1, 2):
            # 15% probability of discrepancy
            if random.random() < 0.15 and expected_qty > 0:
                # Discrepancy!
                counted_qty = max(0, expected_qty + random.choice([-5, -2, -1, 1, 2, 5]))
            else:
                counted_qty = expected_qty

        # CountTask list
        count_tasks.append((
            task_id, 'default-tenant', whid, bid, sku, item['LotNo'], item['ExpiryDate'],
            expected_qty, counted_qty, status, operator, created_at, started_at, completed_at, False
        ))
        
        # Handle discrepancies for Counted and Adjusted tasks
        if status in (1, 2) and counted_qty != expected_qty:
            # Create reconciliation report
            recon_status = 1 # Pending
            notes = None
            if status == 2: # Adjusted
                # 70% Resolved, 30% Ignored
                if random.random() < 0.7:
                    recon_status = 2 # Resolved
                    notes = "Adjusted inventory based on count verification."
                    
                    # Update WMS physical inventory item quantity
                    inventory_updates.append((counted_qty, item['Id']))
                    
                    # Log Ledger entries
                    diff = counted_qty - expected_qty
                    ledger_reason = 8 if diff > 0 else 9 # AdjustIncrease=8, AdjustDecrease=9
                    ledgers.append((
                        str(uuid.uuid4()), item['Id'], sku, whid, bid, item['LotNo'], item['ExpiryDate'],
                        ledger_reason, diff, counted_qty, f"ADJ-COUNT-{task_id[:8].upper()}", "CycleCountAdjustment", operator, completed_at
                    ))
                else:
                    recon_status = 3 # Ignored
                    notes = "Minor mismatch ignored by supervisor."
                    
            reconciliation_reports.append((
                str(uuid.uuid4()), item['Id'], sku, whid, bid, item['LotNo'], item['ExpiryDate'],
                counted_qty, expected_qty, completed_at, recon_status, notes
            ))

        task_count += 1

    # Insert Count Tasks
    if count_tasks:
        psycopg2.extras.execute_batch(cur, """
            INSERT INTO "CountTasks" (
                "Id", "TenantId", "WarehouseId", "BinId", "Sku", "LotNo", "ExpiryDate",
                "ExpectedQty", "CountedQty", "Status", "AssignedTo", "CreatedAt", "StartedAt", "CompletedAt", "IsDeleted"
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT DO NOTHING
        """, count_tasks)

    # Insert Reconciliation Reports
    if reconciliation_reports:
        psycopg2.extras.execute_batch(cur, """
            INSERT INTO "InventoryReconciliationReports" (
                "Id", "InventoryItemId", "Sku", "WarehouseId", "BinId", "LotNo", "ExpiryDate",
                "SnapshotQty", "LedgerQty", "DetectedAt", "Status", "ResolutionNotes"
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT DO NOTHING
        """, reconciliation_reports)

    # Update inventory item quantities for resolved adjustments
    if inventory_updates:
        cur.executemany("""
            UPDATE "InventoryItems"
            SET "QuantityOnHand" = %s
            WHERE "Id" = %s
        """, inventory_updates)

    # Insert Ledgers for resolved adjustments
    if ledgers:
        psycopg2.extras.execute_batch(cur, """
            INSERT INTO "InventoryLedgers" (
                "Id", "InventoryItemId", "Sku", "WarehouseId", "BinId", "LotNo", "ExpiryDate",
                "Reason", "DeltaQty", "BalanceAfter", "ReferenceId", "ReferenceType", "OperatorSub", "OccurredAt"
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT DO NOTHING
        """, ledgers)

    print(f"   Created {len(count_tasks)} CountTasks.")
    print(f"   Created {len(reconciliation_reports)} InventoryReconciliationReports.")
    print(f"   Updated WMS InventoryItems and logged {len(ledgers)} adjustments in Ledgers.")


    print("\n2. Seeding Outbound Returns (RTO)...")
    # Fetch existing Shipments in status Shipped (4) or Delivered (6)
    cur.execute("""
        SELECT "Id", "TenantId", "CustomerId", "ShipmentNo", "WarehouseId", "ShippedAt", "Status"
        FROM "Shipments"
        WHERE "Status" IN (4, 6)
    """)
    shipments = cur.fetchall()
    
    # Shuffle and select 7% of them to return
    random.shuffle(shipments)
    return_shipments_count = int(len(shipments) * 0.07)
    selected_shipments = shipments[:return_shipments_count]
    print(f"   Selected {len(selected_shipments)} shipments for Return processing.")

    # Load all existing InventoryItems in BIN-RETURN bins to build our cache
    cur.execute("""
        SELECT "Id", "WarehouseId", "BinId", "Sku", "LotNo", "ExpiryDate", "QuantityOnHand"
        FROM "InventoryItems"
        WHERE "BinId" = ANY(%s::uuid[])
    """, (list(return_bins.values()),))
    
    return_items = {} # (wh_id, bin_id, sku, lot_no, expiry_date) -> [item_id, qty]
    for row in cur.fetchall():
        item_id, wh_id, bin_id, sku, lot_no, expiry_date, qty = str(row[0]), str(row[1]), str(row[2]), row[3], row[4], row[5], int(row[6])
        return_items[(wh_id, bin_id, sku, lot_no, expiry_date)] = [item_id, qty]

    outbound_returns = []
    rto_ledgers = []

    for ship in selected_shipments:
        ship_id, tenant_id, customer_id, ship_no, wh_id, shipped_at, ship_status = ship
        shipped_at = shipped_at or now - timedelta(days=5)

        # Get ShipmentOrders and outbound OrderNo
        cur.execute("""
            SELECT o."OrderNo", o."Id"
            FROM "ShipmentOrders" so
            JOIN "OutboundOrders" o ON so."OutboundOrderId" = o."Id"
            WHERE so."ShipmentId" = %s
        """, (ship_id,))
        order_rows = cur.fetchall()
        if not order_rows:
            continue
        order_no, ob_order_id = order_rows[0]

        # Get ShipmentItems
        cur.execute("""
            SELECT l."Sku", si."Quantity", si."OutboundOrderLineId"
            FROM "ShipmentItems" si
            JOIN "OutboundOrderLines" l ON si."OutboundOrderLineId" = l."Id"
            WHERE si."ShipmentId" = %s
        """, (ship_id,))
        items = cur.fetchall()
        
        for sku, qty, line_id in items:
            lot_no = "LOT-RTO"
            expiry_date = now + timedelta(days=365)
            if random.random() < 0.8:
                returned_qty = random.randint(1, qty)
                # Condition: 1 = Good, 2 = Damaged
                condition = 1 if random.random() < 0.8 else 2
                
                # Disposition: 1 = Pending, 2 = Restocked, 3 = Scrapped
                if condition == 2: # Damaged
                    disposition = 3 if random.random() < 0.7 else 1 # Scrapped or Pending
                else: # Good
                    disposition = 2 if random.random() < 0.7 else 1 # Restocked or Pending

                return_id = str(uuid.uuid4())
                created_at = shipped_at + timedelta(days=random.randint(1, 4))
                processed_at = created_at + timedelta(hours=random.randint(1, 24)) if disposition in (2, 3) else None
                operator = random.choice(operators) if disposition in (2, 3) else None
                
                notes = random.choice([
                    "Customer refused delivery", "Incorrect delivery address", 
                    "Package damaged in transit", "Customer cancelled order", 
                    "Incomplete items"
                ])

                outbound_returns.append((
                    return_id, tenant_id, customer_id, wh_id, ship_id, order_no, sku,
                    returned_qty, condition, disposition, notes, created_at, processed_at, operator
                ))

                if disposition in (2, 3):
                    return_bin_id = return_bins.get(wh_id)
                    if return_bin_id:
                        key = (wh_id, return_bin_id, sku, lot_no, expiry_date)
                        
                        # Find or create return item
                        if key not in return_items:
                            item_id = str(uuid.uuid4())
                            cur.execute("""
                                INSERT INTO "InventoryItems" (
                                    "Id", "TenantId", "CustomerId", "WarehouseId", "BinId", "Sku", "LotNo", "ExpiryDate",
                                    "QuantityOnHand", "ReservedQty", "LastRestockedAt", "Version"
                                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 0, 0, %s, 1)
                            """, (item_id, tenant_id, customer_id, wh_id, return_bin_id, sku, lot_no, expiry_date, now))
                            return_items[key] = [item_id, 0]
                            
                        item_id, current_qty = return_items[key]
                        
                        if disposition == 2: # Restocked
                            new_qty = current_qty + returned_qty
                            # Update DB
                            cur.execute("""
                                UPDATE "InventoryItems"
                                SET "QuantityOnHand" = %s
                                WHERE "Id" = %s
                            """, (new_qty, item_id))
                            # Update local cache
                            return_items[key][1] = new_qty
                            
                            # Append ledger (Reason 15 = ReturnDispositionRestock)
                            rto_ledgers.append((
                                str(uuid.uuid4()), item_id, sku, wh_id, return_bin_id, lot_no, expiry_date,
                                15, returned_qty, new_qty, f"RTO-RESTOCK-{return_id[:8].upper()}", "OutboundReturnRestock", operator, processed_at
                            ))
                        elif disposition == 3: # Scrapped
                            # Log scrap ledger (Reason 16 = ReturnDispositionScrap)
                            rto_ledgers.append((
                                str(uuid.uuid4()), item_id, sku, wh_id, return_bin_id, lot_no, expiry_date,
                                16, -returned_qty, current_qty, f"RTO-SCRAP-{return_id[:8].upper()}", "OutboundReturnScrap", operator, processed_at
                            ))

    # Insert Outbound Returns
    if outbound_returns:
        psycopg2.extras.execute_batch(cur, """
            INSERT INTO "OutboundReturns" (
                "Id", "TenantId", "CustomerId", "WarehouseId", "ShipmentId", "OrderNo", "Sku",
                "ReturnedQty", "Condition", "Disposition", "Notes", "CreatedAt", "ProcessedAt", "ProcessedBy"
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT DO NOTHING
        """, outbound_returns)

    # Insert RTO Ledgers
    if rto_ledgers:
        psycopg2.extras.execute_batch(cur, """
            INSERT INTO "InventoryLedgers" (
                "Id", "InventoryItemId", "Sku", "WarehouseId", "BinId", "LotNo", "ExpiryDate",
                "Reason", "DeltaQty", "BalanceAfter", "ReferenceId", "ReferenceType", "OperatorSub", "OccurredAt"
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT DO NOTHING
        """, rto_ledgers)

    conn.commit()
    cur.close()
    conn.close()
    
    print(f"   Created {len(outbound_returns)} OutboundReturns.")
    print(f"   Logged {len(rto_ledgers)} RTO transaction ledgers.")
    print("Phase 7 Seeding Completed successfully!")

if __name__ == '__main__':
    seed_phase_7()
