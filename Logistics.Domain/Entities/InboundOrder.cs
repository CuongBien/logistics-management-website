using System;
using System.Collections.Generic;
using Logistics.Domain.Enums;
using Logistics.Domain.Exceptions;

namespace Logistics.Domain.Entities
{
    // Đơn nhập kho (nhận hàng để lưu kho/xử lý)
    public class InboundOrder : BaseEntity
    {
        public Guid SupplierId { get; set; } // Hoặc SenderId
        public Supplier? Supplier { get; set; } // Người gửi/Nhà cung cấp
        
        public DateTime ReceivedDate { get; set; }
        public OrderStatus Status { get; set; } = OrderStatus.New;
        
        public ICollection<InboundOrderLine> Lines { get; set; } = new List<InboundOrderLine>();

        // Domain Behaviors
        public void Confirm()
        {
            if (Lines.Count == 0)
                throw new BusinessRuleException("Cannot confirm an empty inbound order.");
            
            Status = OrderStatus.Confirmed;
        }

        public void Receive()
        {
             if (Status != OrderStatus.Confirmed && Status != OrderStatus.New)
                throw new BusinessRuleException($"Cannot receive goods for order in status {Status}.");

            Status = OrderStatus.Completed; // Hoặc một trạng thái Received nếu muốn chi tiết hơn
            ReceivedDate = DateTime.UtcNow;
        }
    }
}
