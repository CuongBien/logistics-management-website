using System.Reflection;
using BuildingBlocks.Domain;
using Microsoft.EntityFrameworkCore;
using OMS.Application.Common.Interfaces;
using OMS.Domain.Entities;
using OMS.Application.Sagas.OrderFulfillment;
using MediatR;
using MassTransit;

namespace OMS.Infrastructure.Persistence;

public class ApplicationDbContext : DbContext, IApplicationDbContext
{
    private readonly IMediator _mediator;

    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options, 
        IMediator mediator) : base(options) 
    {
        _mediator = mediator;
    }

    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderState> OrderStates => Set<OrderState>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        builder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());

        base.OnModelCreating(builder);
        
        builder.AddInboxStateEntity();
        builder.AddOutboxMessageEntity();
        builder.AddOutboxStateEntity();
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        await _mediator.DispatchDomainEvents(this);

        return await base.SaveChangesAsync(cancellationToken);
    }
}
