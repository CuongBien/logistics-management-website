import psycopg2

def check_wms():
    conn = psycopg2.connect(
        host="localhost",
        port=56432,
        database="lms_wms_dev",
        user="postgres",
        password="postgres"
    )
    cursor = conn.cursor()
    tables = [
        "Warehouses", "Blocks", "Zones", "Bins", "InventoryItems", 
        "OutboundOrders", "InboundReceipts", "PutawayTasks", 
        "PickTasks", "ReplenishmentTasks", "CountTasks", 
        "OperatorProfiles", "OperatorRoleAssignments"
    ]
    print("--- WMS DATABASE ---")
    for t in tables:
        try:
            cursor.execute(f'SELECT COUNT(*) FROM "{t}"')
            count = cursor.fetchone()[0]
            print(f"{t}: {count}")
        except Exception as e:
            print(f"Error reading table {t}: {e}")
            conn.rollback()
    cursor.close()
    conn.close()

def check_oms():
    conn = psycopg2.connect(
        host="localhost",
        port=56432,
        database="lms_oms_dev",
        user="postgres",
        password="postgres"
    )
    cursor = conn.cursor()
    tables = ["Orders", "OrderLines"]
    print("\n--- OMS DATABASE ---")
    for t in tables:
        try:
            cursor.execute(f'SELECT COUNT(*) FROM "{t}"')
            count = cursor.fetchone()[0]
            print(f"{t}: {count}")
        except Exception as e:
            print(f"Error reading table {t}: {e}")
            conn.rollback()
    cursor.close()
    conn.close()

if __name__ == "__main__":
    check_wms()
    check_oms()
