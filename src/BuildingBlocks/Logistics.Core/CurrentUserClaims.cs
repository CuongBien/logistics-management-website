using System.Security.Claims;

namespace Logistics.Core;

public static class CurrentUserClaims
{
    public static string? GetTenantId(ClaimsPrincipal user)
    {
        var val = user.FindFirst("tenant_id")?.Value
            ?? user.FindFirst("tenant")?.Value;
        return string.IsNullOrEmpty(val) ? "default-tenant" : val;
    }

    public static string? GetCustomerId(ClaimsPrincipal user)
    {
        return user.FindFirst("sub")?.Value
            ?? user.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value
            ?? user.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? user.Claims.FirstOrDefault(c => c.Type.EndsWith("nameidentifier") || c.Type == "sub")?.Value;
    }
}
