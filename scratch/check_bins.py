import psycopg2

DB_WMS = "dbname=lms_wms_dev user=postgres password=postgres host=127.0.0.1 port=56432"

def main():
    conn = psycopg2.connect(DB_WMS)
    cur = conn.cursor()
    cur.execute('SELECT "Id", "WarehouseId", "ZoneId", "BinCode", "Status" FROM "Bins" WHERE "BinCode" = \'BIN-RETURN\'')
    rows = cur.fetchall()
    print("Found BIN-RETURN bins:")
    for row in rows:
        print(f"Id: {row[0]}, WarehouseId: {row[1]}, ZoneId: {row[2]}, BinCode: {row[3]}, Status: {row[4]}")
    
    cur.execute('SELECT "Id", "Code", "Name" FROM "Warehouses"')
    wh_rows = cur.fetchall()
    print("\nWarehouses:")
    for r in wh_rows:
        print(f"Id: {r[0]}, Code: {r[1]}, Name: {r[2]}")
        
    cur.close()
    conn.close()

if __name__ == '__main__':
    main()
