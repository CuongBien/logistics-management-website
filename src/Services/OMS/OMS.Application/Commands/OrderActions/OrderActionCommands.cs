using BuildingBlocks.Domain;
using MediatR;

namespace OMS.Application.Commands.OrderActions;

// --- Human-triggered Commands ---

public record PickupOrderCommand(Guid OrderId, string DriverId) : IRequest<Result>;

public record ReceiveOrderCommand(Guid OrderId, string WarehouseId, string ReceivedBy) : IRequest<Result>;

public record SortOrderCommand(Guid OrderId, string DestinationHubId) : IRequest<Result>;

public record DispatchOrderCommand(Guid OrderId, string DriverId, string RouteId) : IRequest<Result>;

public record DeliverOrderCommand(Guid OrderId, string ProofOfDeliveryUrl) : IRequest<Result>;

public record FailDeliveryCommand(Guid OrderId, string Reason) : IRequest<Result>;
