import psycopg2
import json
from datetime import datetime

DB_WMS = "dbname=lms_wms_dev user=postgres password=postgres host=127.0.0.1 port=56432"

def main():
    conn = psycopg2.connect(DB_WMS)
    cur = conn.cursor()
    
    cur.execute("SELECT COUNT(*) FROM \"Shipments\" WHERE \"RouteId\" IS NOT NULL")
    print("Shipments with RouteId:", cur.fetchone()[0])
    
    cur.execute("SELECT COUNT(*) FROM \"Shipments\" WHERE \"DestinationType\" = 0")
    print("Shipments with DestinationType = 0 (Warehouse):", cur.fetchone()[0])
    
    # Fetch sample shipment with RouteId
    cur.execute("SELECT * FROM \"Shipments\" WHERE \"RouteId\" IS NOT NULL LIMIT 1")
    colnames = [desc[0] for desc in cur.description]
    row = cur.fetchone()
    if row:
        shipment = dict(zip(colnames, row))
        for k, v in shipment.items():
            if isinstance(v, datetime):
                shipment[k] = v.isoformat()
        print("\nSample Shipment with RouteId:")
        print(json.dumps(shipment, indent=2, ensure_ascii=False))
    else:
        print("No shipments with RouteId found.")
        
    cur.close()
    conn.close()

if __name__ == '__main__':
    main()
