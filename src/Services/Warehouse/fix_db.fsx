#r "nuget: Npgsql"
open System
open Npgsql

let connString = "Host=127.0.0.1;Port=56432;Database=lms_wms_dev;Username=postgres;Password=postgres"
try
    use conn = new NpgsqlConnection(connString)
    conn.Open()
    use cmd = new NpgsqlCommand("UPDATE \"OutboundOrderLines\" SET \"ReservedQty\" = 5 WHERE \"Sku\" = 'SKU-001';", conn)
    let rows = cmd.ExecuteNonQuery()
    printfn "Updated %d rows" rows
with
| ex -> printfn "Error: %s" ex.Message
