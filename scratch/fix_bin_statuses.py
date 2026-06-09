import psycopg2
import sys
import random

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

DB_WMS = "dbname=lms_wms_dev user=postgres password=postgres host=127.0.0.1 port=56432"

def update_bin_occupancy_statuses():
    print("Updating WMS Bins occupancy statuses based on physical inventory...")
    conn = psycopg2.connect(DB_WMS)
    cur_wms = conn.cursor()
    try:
        # Reset all bins to 'Available' first
        cur_wms.execute('UPDATE "Bins" SET "Status" = \'Available\';')
        
        # Get all bins that contain inventory
        cur_wms.execute('SELECT DISTINCT "BinId" FROM "InventoryItems" WHERE "QuantityOnHand" > 0;')
        occupied_bin_ids = [str(row[0]) for row in cur_wms.fetchall() if row[0] is not None]
        
        print(f"Found {len(occupied_bin_ids)} bins containing physical inventory.")
        if occupied_bin_ids:
            random.shuffle(occupied_bin_ids)
            # 10% to Full, rest to Occupied
            num_full = int(len(occupied_bin_ids) * 0.10)
            full_bins = occupied_bin_ids[:num_full]
            occupied_bins = occupied_bin_ids[num_full:]
            
            if occupied_bins:
                if len(occupied_bins) == 1:
                    cur_wms.execute('UPDATE "Bins" SET "Status" = \'Occupied\' WHERE "Id" = %s;', (occupied_bins[0],))
                else:
                    cur_wms.execute('UPDATE "Bins" SET "Status" = \'Occupied\' WHERE "Id" IN %s;', (tuple(occupied_bins),))
            if full_bins:
                if len(full_bins) == 1:
                    cur_wms.execute('UPDATE "Bins" SET "Status" = \'Full\' WHERE "Id" = %s;', (full_bins[0],))
                else:
                    cur_wms.execute('UPDATE "Bins" SET "Status" = \'Full\' WHERE "Id" IN %s;', (tuple(full_bins),))
            print(f"Successfully updated bin statuses: {len(occupied_bins)} marked 'Occupied', {len(full_bins)} marked 'Full'.")
        conn.commit()
    except Exception as e:
        print(f"Error updating bin statuses: {e}")
        conn.rollback()
    finally:
        cur_wms.close()
        conn.close()

if __name__ == '__main__':
    update_bin_occupancy_statuses()
