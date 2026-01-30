using System;

namespace Logistics.Domain.Entities
{
    public class TransportOrderLine : BaseEntity
    {
        public Guid TransportOrderId { get; set; }
        public TransportOrder? TransportOrder { get; set; }
        
        public Guid ProductId { get; set; }
        public Product? Product { get; set; }
        
        public int Quantity { get; set; }
        public decimal Weight { get; set; } // Khối lượng
    }
}
