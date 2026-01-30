using System;

namespace Logistics.Domain.Entities
{
    public class Inventory : BaseEntity
    {
        public Guid ProductId { get; set; }
        public Product? Product { get; set; }
        
        public Guid WarehouseId { get; set; }
        public Warehouse? Warehouse { get; set; }
        
        public Guid? LocationId { get; set; }
        public Location? Location { get; set; }
        
        public int Quantity { get; set; }
    }
}
