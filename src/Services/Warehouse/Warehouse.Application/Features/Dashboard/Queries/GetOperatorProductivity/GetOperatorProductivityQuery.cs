using Logistics.Core;
using MediatR;

namespace Warehouse.Application.Features.Dashboard.Queries.GetOperatorProductivity;

public record GetOperatorProductivityQuery() : IRequest<Result<List<OperatorProductivityDto>>>;

public record OperatorProductivityDto(
    string OperatorId,
    int PendingTasksCount,
    int CompletedTasksToday
);
