import psycopg2

DB_WMS = "dbname=lms_wms_dev user=postgres password=postgres host=127.0.0.1 port=56432"
DB_OMS = "dbname=lms_oms_dev user=postgres password=postgres host=127.0.0.1 port=56432"

def main():
    print("Connecting to databases for cleanup...")
    conn_wms = psycopg2.connect(DB_WMS)
    cur_wms = conn_wms.cursor()

    conn_oms = psycopg2.connect(DB_OMS)
    cur_oms = conn_oms.cursor()

    try:
        print("Truncating WMS transaction and inventory tables...")
        # Order of truncation handles FK constraints, or we can use CASCADE.
        # Tables to truncate in WMS:
        wms_tables = [
            "inventory_reservations",
            "PickTasks",
            "Waves",
            "OutboundOrderLines",
            "OutboundOrders",
            "PackVerifications",
            "ShipmentItems",
            "ShipmentOrders",
            "Shipments",
            "TransitDiscrepancies",
            "InboundDiscrepancies",
            "PutawayTasks",
            "InboundBinAllocations",
            "InboundReceiptLines",
            "InboundReceipts",
            "InventoryLedgers",
            "InventoryItems",
            "OperatorActivityLogs"
        ]
        
        # We can construct a query using TRUNCATE CASCADE
        wms_tables_str = ", ".join([f'"{t}"' for t in wms_tables])
        truncate_wms_query = f'TRUNCATE TABLE {wms_tables_str} CASCADE;'
        print("Executing WMS Truncate:", truncate_wms_query)
        cur_wms.execute(truncate_wms_query)
        conn_wms.commit()
        print("WMS Truncation complete.")

        print("Truncating OMS transaction tables...")
        # Tables to truncate in OMS:
        oms_tables = [
            "OrderStatusHistories",
            "OrderConsignees",
            "OrderItems",
            "Orders"
        ]
        oms_tables_str = ", ".join([f'"{t}"' for t in oms_tables])
        truncate_oms_query = f'TRUNCATE TABLE {oms_tables_str} CASCADE;'
        print("Executing OMS Truncate:", truncate_oms_query)
        cur_oms.execute(truncate_oms_query)
        conn_oms.commit()
        print("OMS Truncation complete.")

    except Exception as e:
        print("Error during cleanup:", e)
        conn_wms.rollback()
        conn_oms.rollback()
    finally:
        cur_wms.close()
        conn_wms.close()
        cur_oms.close()
        conn_oms.close()

if __name__ == "__main__":
    main()
