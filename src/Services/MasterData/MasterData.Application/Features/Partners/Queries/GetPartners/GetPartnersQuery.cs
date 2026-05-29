using Logistics.Core;
using MediatR;

namespace MasterData.Application.Features.Partners.Queries.GetPartners;

public record GetPartnersQuery(
    string TenantId,
    string? SearchTerm = null,
    int Page = 1,
    int PageSize = 10
) : IRequest<Result<PaginatedList<PartnerDto>>>;

public record PartnerDto(
    Guid Id,
    string Code,
    string Name,
    string Type,
    string? Phone,
    string? Email,
    string? Address,
    string? City,
    string? District,
    double? Latitude,
    double? Longitude,
    bool IsActive,
    DateTime CreatedAt
);

public class PaginatedList<T>
{
    public List<T> Items { get; }
    public int PageIndex { get; }
    public int TotalPages { get; }
    public int TotalCount { get; }

    public PaginatedList(List<T> items, int count, int pageIndex, int pageSize)
    {
        PageIndex = pageIndex;
        TotalPages = (int)Math.Ceiling(count / (double)pageSize);
        TotalCount = count;
        Items = items;
    }
}
