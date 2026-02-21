# Skill: Add Migration (EF Core)

## Overview

Quy trình an toàn để thay đổi cấu trúc Database (Schema Evolution).

**Trigger:** Use this skill when the user asks to modify database schema, add columns, or update entities.

## Steps

1.  **Modify Domain Entity:**
    - Thêm/Sửa property trong class Entity.
2.  **Configure EntityTypeConfiguration:**
    - Update file Configuration của Entity đó (layer `Infrastructure`).
    - Đặt constraints rõ ràng (`HasMaxLength`, `IsRequired`).
3.  **Create Migration:**
    - Chạy lệnh: `dotnet ef migrations add [MigrationName] --project Infrastructure --startup-project Api`.
    - **Noun Verbs Naming:** `AddCustomerEmail`, `UpdateOrderIndex`.
4.  **Review Migration File:**
    - Đọc kỹ file `.cs` vừa sinh ra.
    - Đảm bảo không bị mất dữ liệu (Data Loss Warning).
5.  **Update Database:**
    - Local: `dotnet ef database update`.
    - Prod: Generate Script `dotnet ef migrations script -o migration.sql` để DBA review.
