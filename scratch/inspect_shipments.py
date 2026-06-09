import psycopg2

DB_WMS = "dbname=lms_wms_dev user=postgres password=postgres host=127.0.0.1 port=56432"

def main():
    conn = psycopg2.connect(DB_WMS)
    cur = conn.cursor()
    
    cur.execute("SELECT \"ShipmentNo\", COUNT(*) FROM \"Shipments\" GROUP BY \"ShipmentNo\" LIMIT 20")
    print("Some Shipment Nos:")
    for row in cur.fetchall():
        print(row)
        
    cur.execute("SELECT COUNT(*) FROM \"Shipments\" WHERE \"ShipmentNo\" LIKE 'SHP-202606%'")
    print("Shipments matching 'SHP-202606%':", cur.fetchone()[0])

    cur.execute("SELECT COUNT(*) FROM \"Shipments\" WHERE \"ShipmentNo\" LIKE 'SHP-%-%-%'")
    print("Shipments matching 'SHP-uuid-date-rand':", cur.fetchone()[0])
    
    cur.close()
    conn.close()

if __name__ == "__main__":
    main()
