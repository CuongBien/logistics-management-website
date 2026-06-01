-- Get Warehouse Id for SG (Assuming we know it's a specific warehouse, but to be safe we can use a subquery)
DO $$
DECLARE 
    sgId uuid;
    stagingZoneId uuid;
BEGIN
    SELECT "Id" INTO sgId FROM "Warehouses" WHERE "Code" = 'WH-SG-002' LIMIT 1;
    SELECT "Id" INTO stagingZoneId FROM "Zones" WHERE "BlockId" IN (SELECT "Id" FROM "Blocks" WHERE "WarehouseId" = sgId) AND "ZoneType" = 'Staging' LIMIT 1;

    INSERT INTO "Bins" ("Id", "WarehouseId", "ZoneId", "BinCode", "Status", "Aisle", "Rack", "Shelf", "PickSequence", "Version", "IsDeleted", "DeletedAt")
    VALUES 
        (gen_random_uuid(), sgId, stagingZoneId, 'WALL-A-01', 'Available', 'WALL', 'A', '01', 901, 1, false, null),
        (gen_random_uuid(), sgId, stagingZoneId, 'WALL-A-02', 'Available', 'WALL', 'A', '02', 902, 1, false, null);
END $$;
