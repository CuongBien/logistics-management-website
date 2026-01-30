using System;

namespace Logistics.Domain.Entities
{
    public class Warehouse : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public double Capacity { get; set; }
    }
}
