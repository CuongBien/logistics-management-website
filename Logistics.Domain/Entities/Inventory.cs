using System;
using Logistics.Domain.Exceptions;

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
        
        public int Quantity { get; private set; } // Make setter private to enforce logic

        public void AddStock(int amount)
        {
            if (amount <= 0)
                throw new BusinessRuleException("Amount to add must be greater than zero.");
                
            Quantity += amount;
        }

        public void RemoveStock(int amount)
        {
            if (amount <= 0)
                throw new BusinessRuleException("Amount to remove must be greater than zero.");
                
            if (Quantity < amount)
                throw new BusinessRuleException($"Insufficient stock. Current: {Quantity}, Requested: {amount}.");
                
            Quantity -= amount;
        }
    }
}
