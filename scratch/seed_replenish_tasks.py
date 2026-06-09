import psycopg2
import uuid
import random
from datetime import datetime, timedelta

DB_WMS = "dbname=lms_wms_dev user=postgres password=postgres host=127.0.0.1 port=56432"

def main():
    print("Connecting to WMS database to seed Replenishment Tasks...")
    conn = psycopg2.connect(DB_WMS)
    cur = conn.cursor()
    
    # 1. Clear existing replenishment tasks
    print("Clearing old Replenishment Tasks...")
    cur.execute('DELETE FROM "ReplenishmentTasks"')
    conn.commit()
    
    # 2. Load warehouses
    cur.execute('SELECT "Id", "Code" FROM "Warehouses" WHERE "IsDeleted" = false')
    warehouses = [{'Id': str(row[0]), 'Code': row[1]} for row in cur.fetchall()]
    print(f"Loaded {len(warehouses)} warehouses.")
    
    # 3. Load active operators
    cur.execute('SELECT "OperatorSub" FROM operator_profiles WHERE "IsActive" = true')
    operators = [str(row[0]) for row in cur.fetchall()]
    if not operators:
        operators = ["125e2596-ad32-4f17-b6c3-f02af6eb503d"]
    print(f"Loaded {len(operators)} operators.")
    
    # 4. Generate tasks for each warehouse
    tasks_to_insert = []
    now = datetime.utcnow()
    
    for wh in warehouses:
        wh_id = wh['Id']
        # Load bins for this warehouse
        cur.execute('SELECT "Id", "BinCode" FROM "Bins" WHERE "WarehouseId" = %s AND "IsDeleted" = false', (wh_id,))
        bins = [{'Id': str(row[0]), 'Code': row[1]} for row in cur.fetchall()]
        if not bins:
            print(f"   Skip warehouse {wh['Code']}: No bins found.")
            continue
            
        # Load inventory items for this warehouse to move
        cur.execute('SELECT "BinId", "Sku" FROM "InventoryItems" WHERE "WarehouseId" = %s AND "QuantityOnHand" > 0', (wh_id,))
        inv_items = [{'BinId': str(row[0]), 'Sku': row[1]} for row in cur.fetchall()]
        
        # Fallback to general SKUs if no inventory is recorded
        if not inv_items:
            cur.execute('SELECT "SkuCode" FROM erp_skus LIMIT 10')
            sku_codes = [row[0] for row in cur.fetchall()]
            if not sku_codes:
                sku_codes = ["SKU-RED-TSHIRT", "SKU-BLUE-JEANS", "SKU-IPHONE15"]
            for sku in sku_codes:
                source_bin = random.choice(bins)
                inv_items.append({'BinId': source_bin['Id'], 'Sku': sku})
                
        # Generate 10-15 replenishment tasks per warehouse
        num_tasks = random.randint(10, 15)
        created_count = 0
        
        for item in inv_items[:num_tasks]:
            source_bin_id = item['BinId']
            # Find a destination bin different from source bin
            dest_bins = [b for b in bins if b['Id'] != source_bin_id]
            if not dest_bins:
                continue
                
            dest_bin = random.choice(dest_bins)
            dest_bin_id = dest_bin['Id']
            
            task_id = str(uuid.uuid4())
            sku = item['Sku']
            qty = random.choice([10, 20, 50, 100, 150])
            status = random.choice([0, 1, 2]) # 0=Pending, 1=InProgress, 2=Completed
            
            assigned_to = None
            if status in (1, 2):
                assigned_to = random.choice(operators)
                
            created_at = now - timedelta(days=random.randint(1, 10), hours=random.randint(0, 23), minutes=random.randint(0, 59))
            started_at = created_at + timedelta(minutes=random.randint(5, 30)) if status in (1, 2) else None
            completed_at = started_at + timedelta(minutes=random.randint(10, 45)) if status == 2 else None
            
            tasks_to_insert.append((
                task_id,
                'default-tenant',
                wh_id,
                sku,
                source_bin_id,
                dest_bin_id,
                qty,
                status,
                assigned_to,
                False, # IsDeleted
                None,  # DeletedAt
                created_at,
                completed_at,
                started_at
            ))
            created_count += 1
            
        print(f"   Generated {created_count} replenishment tasks for warehouse {wh['Code']}.")
        
    # 5. Bulk insert tasks into WMS
    if tasks_to_insert:
        cur.executemany("""
            INSERT INTO "ReplenishmentTasks" (
                "Id", "TenantId", "WarehouseId", "Sku", "SourceBinId", "DestinationBinId",
                "RequestedQty", "Status", "AssignedTo", "IsDeleted", "DeletedAt", "CreatedAt", "CompletedAt", "StartedAt"
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, tasks_to_insert)
        conn.commit()
        print(f"\nSUCCESS: Seeded {len(tasks_to_insert)} total replenishment tasks.")
    else:
        print("\nNo tasks to insert.")
        
    cur.close()
    conn.close()

if __name__ == '__main__':
    main()
