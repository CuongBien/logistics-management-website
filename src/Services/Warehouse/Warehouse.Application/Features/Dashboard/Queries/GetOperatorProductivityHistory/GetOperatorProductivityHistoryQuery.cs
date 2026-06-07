using Logistics.Core;
using MediatR;

namespace Warehouse.Application.Features.Dashboard.Queries.GetOperatorProductivityHistory;

public record GetOperatorProductivityHistoryQuery(Guid? WarehouseId = null) : IRequest<Result<OperatorProductivityHistoryDto>>;

public record OperatorProductivityHistoryDto(
    List<DailyProductivityDto> Trend,
    List<OperatorLeaderboardDto> Leaderboard
);

public record DailyProductivityDto(
    string Date,
    int PutawayCount,
    int PickCount,
    int ReplenishCount,
    int CountCount
);

public record OperatorLeaderboardDto(
    string OperatorId,
    int TotalCompleted,
    double AvgDurationSeconds,
    int PendingTasksCount
);
