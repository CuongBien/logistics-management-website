using System;
using System.Collections.Generic;
using Logistics.Domain.Enums;
using Logistics.Domain.Exceptions;

namespace Logistics.Domain.Entities
{
    public class TransportOrder : BaseEntity
    {
        public Guid CustomerId { get; set; } // Khách hàng gửi
        public Customer? Customer { get; set; }
        
        public DateTime OrderDate { get; set; }
        public DateTime? DeliveryDate { get; set; }
        
        public string PickupAddress { get; set; } = string.Empty;
        public string DeliveryAddress { get; set; } = string.Empty;
        
        public OrderStatus Status { get; set; } = OrderStatus.New;
        public decimal TotalFee { get; set; } // Phí vận chuyển
        
        public ICollection<TransportOrderLine> Lines { get; set; } = new List<TransportOrderLine>();

        // Domain Behaviors
        public void Confirm()
        {
            if (Lines.Count == 0)
                throw new BusinessRuleException("Cannot confirm an empty order.");

            if (Status != OrderStatus.New)
                throw new BusinessRuleException($"Cannot confirm order in status {Status}.");

            Status = OrderStatus.Confirmed;
        }

        public void AssignDriver()
        {
            if (Status != OrderStatus.Confirmed)
                throw new BusinessRuleException($"Cannot assign driver to order in status {Status}. Only Confirmed orders can be assigned.");

            Status = OrderStatus.Assigned;
        }

        public void PickUp()
        {
            if (Status != OrderStatus.Assigned)
                throw new BusinessRuleException($"Cannot pick up order in status {Status}.");

            Status = OrderStatus.Picking;
        }

        public void StartTransport()
        {
             if (Status != OrderStatus.Picking && Status != OrderStatus.PickedUp)
                throw new BusinessRuleException($"Cannot start transport for order in status {Status}.");
            
            Status = OrderStatus.InTransit;
        }

        public void Complete()
        {
            if (Status != OrderStatus.InTransit)
                throw new BusinessRuleException($"Cannot complete order in status {Status}.");

            Status = OrderStatus.Completed;
            DeliveryDate = DateTime.UtcNow;
        }

        public void Cancel()
        {
            if (Status == OrderStatus.Completed || Status == OrderStatus.Delivered)
                throw new BusinessRuleException("Cannot cancel an order that has already been delivered or completed.");

            Status = OrderStatus.Cancelled;
        }
    }
}
