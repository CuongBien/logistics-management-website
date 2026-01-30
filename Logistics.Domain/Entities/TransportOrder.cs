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
        public decimal ShippingFee { get; set; }  // Phí ship (vd: 30k)
        public decimal CODAmount { get; set; }    // Tiền thu hộ (vd: 500k tiền hàng)
        
        public decimal TotalAmountToCollect => 
            PaymentMethod == PaymentMethod.ReceiverPays ? (CODAmount + ShippingFee) : CODAmount;
            
        public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.SenderPays;
        public bool IsCodCollected { get; set; } = false; // Đã thu tiền chưa?
        public bool IsReconciled { get; set; } = false;   // Đã trả tiền lại cho Shop chưa?
        
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

        public void CollectPayment()
        {
            if (Status != OrderStatus.Delivered && Status != OrderStatus.Completed)
                throw new BusinessRuleException("Cannot collect payment for an order that is not Delivered.");

            if (IsCodCollected)
                throw new BusinessRuleException("Payment has already been collected.");

            if (TotalAmountToCollect <= 0)
                throw new BusinessRuleException("No amount to collect for this order.");

            IsCodCollected = true;
        }

        public void Reconcile()
        {
            if (!IsCodCollected && TotalAmountToCollect > 0)
                throw new BusinessRuleException("Cannot reconcile before collecting payment.");
            
            if (IsReconciled)
                 throw new BusinessRuleException("Order is already reconciled.");

            IsReconciled = true;
            
            // If everything is done, we can mark order as Completed entirely
            if (Status == OrderStatus.Delivered)
            {
                Status = OrderStatus.Completed;
            }
        }
    }
}
