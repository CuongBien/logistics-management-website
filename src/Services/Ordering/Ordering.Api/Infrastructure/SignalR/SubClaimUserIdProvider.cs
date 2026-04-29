using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;

namespace Ordering.Api.Infrastructure.SignalR;

public class SubClaimUserIdProvider : IUserIdProvider
{
    public string? GetUserId(HubConnectionContext connection)
    {
        // Keep SignalR user targeting aligned with OMS consignor identity (JWT sub claim).
        return connection.User?.FindFirst("sub")?.Value
            ?? connection.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    }
}
