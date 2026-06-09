import psycopg2

DB_WMS = "dbname=lms_wms_dev user=postgres password=postgres host=127.0.0.1 port=56432"

def main():
    print("=== VERIFYING PHASE 7 DATA IN WMS ===")
    conn = psycopg2.connect(DB_WMS)
    cur = conn.cursor()

    # 1. CountTasks
    cur.execute('SELECT COUNT(*) FROM "CountTasks"')
    total_counts = cur.fetchone()[0]
    print(f"Total CountTasks: {total_counts}")

    cur.execute('SELECT "Status", COUNT(*) FROM "CountTasks" GROUP BY "Status" ORDER BY "Status"')
    status_names = {0: "Pending", 1: "Counted", 2: "Adjusted", 3: "Cancelled"}
    print("CountTasks by Status:")
    for status, count in cur.fetchall():
        print(f"  * {status_names.get(status, f'Unknown ({status})')}: {count}")

    # 2. InventoryReconciliationReports
    cur.execute('SELECT COUNT(*) FROM "InventoryReconciliationReports"')
    total_recons = cur.fetchone()[0]
    print(f"\nTotal InventoryReconciliationReports: {total_recons}")

    cur.execute('SELECT "Status", COUNT(*) FROM "InventoryReconciliationReports" GROUP BY "Status" ORDER BY "Status"')
    recon_status_names = {1: "Pending", 2: "Resolved", 3: "Ignored"}
    print("Reconciliation Reports by Status:")
    for status, count in cur.fetchall():
        print(f"  * {recon_status_names.get(status, f'Unknown ({status})')}: {count}")

    # 3. OutboundReturns
    cur.execute('SELECT COUNT(*) FROM "OutboundReturns"')
    total_returns = cur.fetchone()[0]
    print(f"\nTotal OutboundReturns: {total_returns}")

    cur.execute('SELECT "Disposition", COUNT(*) FROM "OutboundReturns" GROUP BY "Disposition" ORDER BY "Disposition"')
    disp_names = {1: "Pending", 2: "Restocked", 3: "Scrapped", 4: "Penalized"}
    print("OutboundReturns by Disposition:")
    for disp, count in cur.fetchall():
        print(f"  * {disp_names.get(disp, f'Unknown ({disp})')}: {count}")

    # 4. InventoryItems in BIN-RETURN
    cur.execute("""
        SELECT COUNT(*), SUM("QuantityOnHand")
        FROM "InventoryItems" i
        JOIN "Bins" b ON i."BinId" = b."Id"
        WHERE b."BinCode" = 'BIN-RETURN'
    """)
    items_count, total_qty = cur.fetchone()
    print(f"\nInventory Items in BIN-RETURN bins: {items_count} rows, Total Qty: {total_qty}")

    # 5. InventoryLedgers for Returns and Adjustments
    cur.execute("""
        SELECT "Reason", COUNT(*), SUM(ABS("DeltaQty"))
        FROM "InventoryLedgers"
        WHERE "Reason" IN (8, 9, 15, 16)
        GROUP BY "Reason"
        ORDER BY "Reason"
    """)
    ledger_reasons = {
        8: "AdjustIncrease (Cycle Count)",
        9: "AdjustDecrease (Cycle Count)",
        15: "ReturnDispositionRestock (RTO)",
        16: "ReturnDispositionScrap (RTO)"
    }
    print("\nInventoryLedgers for Phase 7 (Audit Logs):")
    for reason, count, sum_delta in cur.fetchall():
        print(f"  * {ledger_reasons.get(reason, f'Unknown ({reason})')}: {count} entries, Sum Delta: {sum_delta}")

    cur.close()
    conn.close()
    print("\nPhase 7 verification completed successfully!")

if __name__ == "__main__":
    main()
