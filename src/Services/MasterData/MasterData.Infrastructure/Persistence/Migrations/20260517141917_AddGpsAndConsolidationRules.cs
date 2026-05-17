using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MasterData.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddGpsAndConsolidationRules : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "Latitude",
                table: "Partners",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Longitude",
                table: "Partners",
                type: "double precision",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ConsolidationRules",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    RuleCode = table.Column<string>(type: "text", nullable: false),
                    TransportMode = table.Column<string>(type: "text", nullable: false),
                    MaxRadiusKm = table.Column<double>(type: "double precision", nullable: false),
                    MaxWeightKg = table.Column<decimal>(type: "numeric", nullable: false),
                    MaxVolumeCBM = table.Column<decimal>(type: "numeric", nullable: false),
                    SlaMatchRequired = table.Column<bool>(type: "boolean", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ConsolidationRules", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ConsolidationRules");

            migrationBuilder.DropColumn(
                name: "Latitude",
                table: "Partners");

            migrationBuilder.DropColumn(
                name: "Longitude",
                table: "Partners");
        }
    }
}
