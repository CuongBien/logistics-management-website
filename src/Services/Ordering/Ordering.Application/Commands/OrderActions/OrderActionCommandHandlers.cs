using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Ordering.Application.Common.Interfaces;

namespace Ordering.Application.Commands.OrderActions;

public class PickupOrderCommandHandler : IRequestHandler<PickupOrderCommand, Result>
{
    private readonly IApplicationDbContext _context;

    public PickupOrderCommandHandler(IApplicationDbContext context) => _context = context;

    public async Task<Result> Handle(PickupOrderCommand request, CancellationToken cancellationToken)
    {
        var order = await _context.Orders.FirstOrDefaultAsync(x => x.Id == request.OrderId, cancellationToken);
        if (order is null) return Result.Failure(new Error("Order.NotFound", "Order was not found."));

        var result = order.MarkPickedUp(request.DriverId);
        if (result.IsFailure) return result;

        await _context.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}

public class ReceiveOrderCommandHandler : IRequestHandler<ReceiveOrderCommand, Result>
{
    private readonly IApplicationDbContext _context;

    public ReceiveOrderCommandHandler(IApplicationDbContext context) => _context = context;

    public async Task<Result> Handle(ReceiveOrderCommand request, CancellationToken cancellationToken)
    {
        var order = await _context.Orders.FirstOrDefaultAsync(x => x.Id == request.OrderId, cancellationToken);
        if (order is null) return Result.Failure(new Error("Order.NotFound", "Order was not found."));

        var result = order.MarkInWarehouse(request.WarehouseId, request.ReceivedBy);
        if (result.IsFailure) return result;

        await _context.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}

public class SortOrderCommandHandler : IRequestHandler<SortOrderCommand, Result>
{
    private readonly IApplicationDbContext _context;

    public SortOrderCommandHandler(IApplicationDbContext context) => _context = context;

    public async Task<Result> Handle(SortOrderCommand request, CancellationToken cancellationToken)
    {
        var order = await _context.Orders.FirstOrDefaultAsync(x => x.Id == request.OrderId, cancellationToken);
        if (order is null) return Result.Failure(new Error("Order.NotFound", "Order was not found."));

        var result = order.MarkSorted(request.DestinationHubId);
        if (result.IsFailure) return result;

        await _context.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}

public class DispatchOrderCommandHandler : IRequestHandler<DispatchOrderCommand, Result>
{
    private readonly IApplicationDbContext _context;

    public DispatchOrderCommandHandler(IApplicationDbContext context) => _context = context;

    public async Task<Result> Handle(DispatchOrderCommand request, CancellationToken cancellationToken)
    {
        var order = await _context.Orders.FirstOrDefaultAsync(x => x.Id == request.OrderId, cancellationToken);
        if (order is null) return Result.Failure(new Error("Order.NotFound", "Order was not found."));

        var result = order.MarkDispatched(request.DriverId, request.RouteId);
        if (result.IsFailure) return result;

        await _context.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}

public class DeliverOrderCommandHandler : IRequestHandler<DeliverOrderCommand, Result>
{
    private readonly IApplicationDbContext _context;

    public DeliverOrderCommandHandler(IApplicationDbContext context) => _context = context;

    public async Task<Result> Handle(DeliverOrderCommand request, CancellationToken cancellationToken)
    {
        var order = await _context.Orders.FirstOrDefaultAsync(x => x.Id == request.OrderId, cancellationToken);
        if (order is null) return Result.Failure(new Error("Order.NotFound", "Order was not found."));

        var result = order.MarkDelivered(request.ProofOfDeliveryUrl);
        if (result.IsFailure) return result;

        await _context.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}

public class FailDeliveryCommandHandler : IRequestHandler<FailDeliveryCommand, Result>
{
    private readonly IApplicationDbContext _context;

    public FailDeliveryCommandHandler(IApplicationDbContext context) => _context = context;

    public async Task<Result> Handle(FailDeliveryCommand request, CancellationToken cancellationToken)
    {
        var order = await _context.Orders.FirstOrDefaultAsync(x => x.Id == request.OrderId, cancellationToken);
        if (order is null) return Result.Failure(new Error("Order.NotFound", "Order was not found."));

        var result = order.MarkFailed(request.Reason);
        if (result.IsFailure) return result;

        await _context.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
