using System;
using Logistics.Domain.Enums;

namespace Logistics.Domain.Entities
{
    public class Employee : BaseEntity
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public EmployeeRole Role { get; set; } = EmployeeRole.WarehouseStaff;
    }
}
