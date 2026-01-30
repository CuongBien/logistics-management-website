using System;
using Logistics.Domain.Enums;

namespace Logistics.Domain.Entities
{
    public class Shipment : BaseEntity
    {
        public Guid TransportOrderId { get; set; }
        public TransportOrder? TransportOrder { get; set; }
        public DateTime? ShipmentDate { get; set; }
        public string Carrier { get; set; } = string.Empty;
        public string TrackingNumber { get; set; } = string.Empty;
        public ShipmentStatus Status { get; set; } = ShipmentStatus.Pending;
    }
}
