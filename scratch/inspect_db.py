import psycopg2
import sys

# Force UTF-8 stdout
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

DB_WMS = "dbname=lms_wms_dev user=postgres password=postgres host=127.0.0.1 port=56432"

def main():
    conn_wms = psycopg2.connect(DB_WMS)
    cur_wms = conn_wms.cursor()

    cur_wms.execute("SELECT \"Id\", \"OrderId\", \"WarehouseId\", \"DestinationCity\", \"Latitude\", \"Longitude\", \"Weight\", \"Volume\", \"Status\" FROM \"OutboundOrders\" LIMIT 10")
    print("OutboundOrders Sample (first 10):")
    for row in cur_wms.fetchall():
        print(f"Id: {row[0]}, OrderId: {row[1]}, WH: {row[2]}, DestCity: {row[3]}, Lat: {row[4]}, Lng: {row[5]}, Wt: {row[6]}, Vol: {row[7]}, Status: {row[8]}")

    cur_wms.close()
    conn_wms.close()

if __name__ == "__main__":
    main()
