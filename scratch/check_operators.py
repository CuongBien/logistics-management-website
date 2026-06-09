import psycopg2

DB_WMS = "dbname=lms_wms_dev user=postgres password=postgres host=127.0.0.1 port=56432"

def main():
    conn = psycopg2.connect(DB_WMS)
    cur = conn.cursor()

    cur.execute("SELECT COUNT(*) FROM operator_profiles")
    print("operator_profiles count:", cur.fetchone()[0])

    cur.execute("SELECT COUNT(*) FROM \"OperatorRoleAssignments\"")
    print("OperatorRoleAssignments count:", cur.fetchone()[0])

    cur.execute("""
        SELECT op."DisplayName", op."OperatorSub", r."Code", w."Code"
        FROM "OperatorRoleAssignments" a
        JOIN operator_profiles op ON a."OperatorProfileId" = op."Id"
        JOIN "Roles" r ON a."RoleId" = r."Id"
        JOIN "Warehouses" w ON a."WarehouseId" = w."Id"
        LIMIT 20
    """)
    print("Assignments Sample:")
    for row in cur.fetchall():
        print(row)

    cur.close()
    conn.close()

if __name__ == "__main__":
    main()
