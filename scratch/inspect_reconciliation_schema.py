import psycopg2

DB_WMS = "dbname=lms_wms_dev user=postgres password=postgres host=127.0.0.1 port=56432"

def main():
    conn = psycopg2.connect(DB_WMS)
    cur = conn.cursor()
    
    cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'InventoryReconciliationReports'")
    print("InventoryReconciliationReports Columns:")
    for row in cur.fetchall():
        print(row)
        
    cur.close()
    conn.close()

if __name__ == "__main__":
    main()
