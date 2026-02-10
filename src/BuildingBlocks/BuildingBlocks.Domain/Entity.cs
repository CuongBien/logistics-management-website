using System.ComponentModel.DataAnnotations.Schema;

namespace BuildingBlocks.Domain;

public interface IEntity
{
    public IReadOnlyList<IDomainEvent> DomainEvents { get; }
    public void ClearDomainEvents();
}

public abstract class Entity<TId> : IEntity
{
    public TId Id { get; protected set; }

    private readonly List<IDomainEvent> _domainEvents = new();

    [NotMapped]
    public IReadOnlyList<IDomainEvent> DomainEvents => _domainEvents.AsReadOnly();

    public void AddDomainEvent(IDomainEvent domainEvent)
    {
        _domainEvents.Add(domainEvent);
    }

    public void RemoveDomainEvent(IDomainEvent domainEvent)
    {
        _domainEvents.Remove(domainEvent);
    }

    public void ClearDomainEvents()
    {
        _domainEvents.Clear();
    }
}
