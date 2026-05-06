using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Warehouse.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class PhaseA_StandardizeLayout : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1. Safe drop old indexes
            migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_Zones_BlockId\";");
            migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_Blocks_WarehouseId\";");
            migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_Bins_ZoneId\";");

            // 2. Safe add WarehouseId column to Bins
            migrationBuilder.Sql(@"
                DO $$ 
                BEGIN 
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Bins' AND column_name='WarehouseId') THEN
                        ALTER TABLE ""Bins"" ADD COLUMN ""WarehouseId"" uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';
                    END IF;
                END $$;");

            // 3. Update seed data for Bins
            migrationBuilder.Sql("UPDATE \"Bins\" SET \"WarehouseId\" = '11111111-1111-1111-1111-111111111111' WHERE \"Id\" IN ('44444444-4444-4444-4444-444444444444', '55555555-5555-5555-5555-555555555555');");
            migrationBuilder.Sql("UPDATE \"Bins\" SET \"WarehouseId\" = '48b030da-e7ad-452f-90db-ddb01a613583' WHERE \"Id\" = 'dddddddd-dddd-dddd-dddd-dddddddddddd';");

            // 4. Safe create new indexes
            migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_Zones_BlockId_ZoneType\";");
            migrationBuilder.Sql("CREATE INDEX \"IX_Zones_BlockId_ZoneType\" ON \"Zones\" (\"BlockId\", \"ZoneType\");");

            migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_Blocks_WarehouseId_BlockCode\";");
            migrationBuilder.Sql("CREATE UNIQUE INDEX \"IX_Blocks_WarehouseId_BlockCode\" ON \"Blocks\" (\"WarehouseId\", \"BlockCode\");");

            migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_Bins_WarehouseId_BinCode\";");
            migrationBuilder.Sql("CREATE UNIQUE INDEX \"IX_Bins_WarehouseId_BinCode\" ON \"Bins\" (\"WarehouseId\", \"BinCode\");");

            migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_Bins_ZoneId_Status\";");
            migrationBuilder.Sql("CREATE INDEX \"IX_Bins_ZoneId_Status\" ON \"Bins\" (\"ZoneId\", \"Status\");");

            // 5. Safe add Check Constraint
            migrationBuilder.Sql(@"
                DO $$ 
                BEGIN 
                    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CK_Bin_Version_Positive') THEN
                        ALTER TABLE ""Bins"" ADD CONSTRAINT ""CK_Bin_Version_Positive"" CHECK (""Version"" >= 1);
                    END IF;
                END $$;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Zones_BlockId_ZoneType",
                table: "Zones");

            migrationBuilder.DropIndex(
                name: "IX_Blocks_WarehouseId_BlockCode",
                table: "Blocks");

            migrationBuilder.DropIndex(
                name: "IX_Bins_WarehouseId_BinCode",
                table: "Bins");

            migrationBuilder.DropIndex(
                name: "IX_Bins_ZoneId_Status",
                table: "Bins");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Bin_Version_Positive",
                table: "Bins");

            migrationBuilder.DropColumn(
                name: "WarehouseId",
                table: "Bins");

            migrationBuilder.CreateIndex(
                name: "IX_Zones_BlockId",
                table: "Zones",
                column: "BlockId");

            migrationBuilder.CreateIndex(
                name: "IX_Blocks_WarehouseId",
                table: "Blocks",
                column: "WarehouseId");

            migrationBuilder.CreateIndex(
                name: "IX_Bins_ZoneId",
                table: "Bins",
                column: "ZoneId");
        }
    }
}
