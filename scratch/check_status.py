import psycopg2

DB_WMS = "dbname=lms_wms_dev user=postgres password=postgres host=127.0.0.1 port=56432"
DB_OMS = "dbname=lms_oms_dev user=postgres password=postgres host=127.0.0.1 port=56432"

def main():
    conn_wms = psycopg2.connect(DB_WMS)
    cur_wms = conn_wms.cursor()
    cur_wms.execute('SELECT "Status", COUNT(*) FROM "OutboundOrders" GROUP BY "Status"')
    print('WMS OutboundOrders status count:', cur_wms.fetchall())

    cur_wms.execute('SELECT COUNT(*) FROM "Shipments"')
    print('WMS Shipments count:', cur_wms.fetchone()[0])

    cur_wms.execute('SELECT "Status", COUNT(*) FROM "Shipments" GROUP BY "Status"')
    print('WMS Shipments status count:', cur_wms.fetchall())

    conn_oms = psycopg2.connect(DB_OMS)
    cur_oms = conn_oms.cursor()
    cur_oms.execute('SELECT "Status", COUNT(*) FROM "Orders" GROUP BY "Status"')
    print('OMS Orders status count:', cur_oms.fetchall())

    cur_wms.close()
    conn_wms.close()
    cur_oms.close()
    conn_oms.close()

if __name__ == "__main__":
    main()
