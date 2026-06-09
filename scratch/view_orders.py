import psycopg2
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

DB_OMS = "dbname=lms_oms_dev user=postgres password=postgres host=127.0.0.1 port=56432"
DB_WMS = "dbname=lms_wms_dev user=postgres password=postgres host=127.0.0.1 port=56432"

def view_data():
    conn_oms = psycopg2.connect(DB_OMS)
    cur_oms = conn_oms.cursor()
    
    cur_oms.execute('SELECT COUNT(*) FROM "Orders";')
    print("OMS Total Orders:", cur_oms.fetchone()[0])
    
    cur_oms.execute('SELECT * FROM "Orders" LIMIT 2;')
    rows = cur_oms.fetchall()
    print("OMS Orders Samples:")
    for row in rows:
        print(row)
        
    cur_oms.close()
    conn_oms.close()
    
    conn_wms = psycopg2.connect(DB_WMS)
    cur_wms = conn_wms.cursor()
    
    cur_wms.execute('SELECT COUNT(*) FROM "OutboundOrders";')
    print("\nWMS Total Outbound Orders:", cur_wms.fetchone()[0])
    
    cur_wms.execute('SELECT * FROM "OutboundOrders" LIMIT 2;')
    rows = cur_wms.fetchall()
    print("WMS OutboundOrders Samples:")
    for row in rows:
        print(row)
        
    cur_wms.close()
    conn_wms.close()

if __name__ == '__main__':
    view_data()
