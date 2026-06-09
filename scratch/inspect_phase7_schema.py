import psycopg2

DB_WMS = "dbname=lms_wms_dev user=postgres password=postgres host=127.0.0.1 port=56432"

def main():
    conn = psycopg2.connect(DB_WMS)
    cur = conn.cursor()
    
    cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'CountTasks'")
    print("CountTasks Columns:")
    for row in cur.fetchall():
        print(row)
        
    print("\n" + "="*50 + "\n")
    
    cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'OutboundReturns'")
    print("OutboundReturns Columns:")
    for row in cur.fetchall():
        print(row)
        
    cur.close()
    conn.close()

if __name__ == "__main__":
    main()
