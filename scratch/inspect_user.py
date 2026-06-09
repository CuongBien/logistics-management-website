import psycopg2

conn = psycopg2.connect("host=127.0.0.1 port=56432 dbname=lms_wms_dev user=postgres password=postgres")
cur = conn.cursor()

op_sub = '125e2596-ad32-4f17-b6c3-f02af6eb503d'

print(f"=== Inspecting OperatorSub: {op_sub} ===")
cur.execute('SELECT "Id", "TenantId", "OperatorSub", "DisplayName", "IsActive" FROM operator_profiles WHERE "OperatorSub" = %s;', (op_sub,))
profile = cur.fetchone()

if not profile:
    print("No operator profile found for this OperatorSub!")
else:
    print("Profile:", profile)
    profile_id = profile[0]
    
    cur.execute('''
        SELECT a."Id", r."Code", w."Name", a."Status"
        FROM "OperatorRoleAssignments" a
        JOIN "Roles" r ON a."RoleId" = r."Id"
        JOIN "Warehouses" w ON a."WarehouseId" = w."Id"
        WHERE a."OperatorProfileId" = %s;
    ''', (profile_id,))
    assignments = cur.fetchall()
    print("\n=== Role Assignments ===")
    for a in assignments:
        print(a)

cur.close()
conn.close()
