using System;

namespace Logistics.Domain.Entities
{
    public class Location : BaseEntity
    {
        public Guid WarehouseId { get; set; }
        public Warehouse? Warehouse { get; set; }
        public string BinCode { get; set; } = string.Empty;
        public string Aisle { get; set; } = string.Empty;
        public string Shelf { get; set; } = string.Empty;
    }
}
