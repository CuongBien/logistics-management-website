import psycopg2

DB_WMS = "dbname=lms_wms_dev user=postgres password=postgres host=127.0.0.1 port=56432"
DB_OMS = "dbname=lms_oms_dev user=postgres password=postgres host=127.0.0.1 port=56432"

def main():
    conn_wms = psycopg2.connect(DB_WMS)
    cur_wms = conn_wms.cursor()
    cur_wms.execute("SELECT * FROM \"OutboundOrders\" WHERE \"Id\" = 'd1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1'")
    print("WMS OutboundOrder:")
    print(cur_wms.fetchone())

    conn_oms = psycopg2.connect(DB_OMS)
    cur_oms = conn_oms.cursor()
    cur_oms.execute("SELECT * FROM \"Orders\" WHERE \"Id\" = 'd1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1'")
    print("OMS Order:")
    print(cur_oms.fetchone())

    cur_wms.close()
    conn_wms.close()
    cur_oms.close()
    conn_oms.close()

if __name__ == "__main__":
    main()
