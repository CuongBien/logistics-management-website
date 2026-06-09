import psycopg2

DB_WMS = "dbname=lms_wms_dev user=postgres password=postgres host=127.0.0.1 port=56432"

def cleanup():
    conn = psycopg2.connect(DB_WMS)
    cur = conn.cursor()
    try:
        # Delete duplicate role assignments keeping the one with the minimum Id
        cur.execute('''
            DELETE FROM "OperatorRoleAssignments" a
            WHERE a."Id" NOT IN (
                SELECT MIN("Id"::text)::uuid
                FROM "OperatorRoleAssignments"
                GROUP BY "OperatorProfileId", "WarehouseId", "RoleId", COALESCE("ZoneId", '00000000-0000-0000-0000-000000000000'::uuid)
            );
        ''')
        deleted = cur.rowcount
        conn.commit()
        print(f"Removed {deleted} duplicate operator role assignments.")
    except Exception as e:
        print(f"Error during cleanup: {e}")
        conn.rollback()
    finally:
        cur.close()
        conn.close()

if __name__ == '__main__':
    cleanup()
