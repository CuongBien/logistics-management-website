using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Warehouse.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RefactorPickTaskWaveSupport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "CompletedAt",
                table: "PickTasks",
                newName: "PickedAt");

            migrationBuilder.RenameColumn(
                name: "AssignedOperator",
                table: "PickTasks",
                newName: "AssignedOperatorId");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "PickTasks",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "WaveId",
                table: "PickTasks",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_PickTasks_WaveId",
                table: "PickTasks",
                column: "WaveId");

            migrationBuilder.AddForeignKey(
                name: "FK_PickTasks_Bins_FromBinId",
                table: "PickTasks",
                column: "FromBinId",
                principalTable: "Bins",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PickTasks_Bins_FromBinId",
                table: "PickTasks");

            migrationBuilder.DropIndex(
                name: "IX_PickTasks_WaveId",
                table: "PickTasks");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "PickTasks");

            migrationBuilder.DropColumn(
                name: "WaveId",
                table: "PickTasks");

            migrationBuilder.RenameColumn(
                name: "PickedAt",
                table: "PickTasks",
                newName: "CompletedAt");

            migrationBuilder.RenameColumn(
                name: "AssignedOperatorId",
                table: "PickTasks",
                newName: "AssignedOperator");
        }
    }
}
