using System.Security.Claims;

namespace Logistics.Core;

public static class CurrentUserClaims
{
    public static string? GetTenantId(ClaimsPrincipal user)
    {
        return user.FindFirst("tenant_id")?.Value
            ?? user.FindFirst("tenant")?.Value;
    }

    public static string? GetCustomerId(ClaimsPrincipal user)
    {
        return user.FindFirst("sub")?.Value
            ?? user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    }
}
