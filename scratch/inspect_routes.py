import psycopg2

DB_WMS = "dbname=lms_wms_dev user=postgres password=postgres host=127.0.0.1 port=56432"

def main():
    conn = psycopg2.connect(DB_WMS)
    cur = conn.cursor()
    
    cur.execute("SELECT COUNT(*) FROM \"WarehouseRoutes\"")
    print("WarehouseRoutes count:", cur.fetchone()[0])
    
    cur.execute("SELECT * FROM \"WarehouseRoutes\" LIMIT 10")
    print("WarehouseRoutes sample:")
    for row in cur.fetchall():
        print(row)
        
    cur.close()
    conn.close()

if __name__ == "__main__":
    main()
