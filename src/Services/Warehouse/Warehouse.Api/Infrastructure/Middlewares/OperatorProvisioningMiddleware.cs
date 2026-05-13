using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using System.Security.Claims;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;

namespace Warehouse.Api.Infrastructure.Middlewares;

public class OperatorProvisioningMiddleware
{
    private readonly RequestDelegate _next;
    private static readonly TimeSpan CacheDuration = TimeSpan.FromHours(1);

    public OperatorProvisioningMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, IApplicationDbContext dbContext, IMemoryCache cache)
    {
        var user = context.User;
        if (user.Identity?.IsAuthenticated == true)
        {
            var sub = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? user.FindFirstValue("sub");
            var tenantId = user.FindFirstValue("tenantId") ?? "default-tenant";

            if (!string.IsNullOrEmpty(sub))
            {
                var cacheKey = $"provisioned_{sub}";
                if (!cache.TryGetValue(cacheKey, out bool isProvisioned))
                {
                    isProvisioned = await dbContext.OperatorProfiles.AnyAsync(p => p.OperatorSub == sub);

                    if (!isProvisioned)
                    {
                        var displayName = user.FindFirstValue("preferred_username") ?? user.FindFirstValue(ClaimTypes.Name) ?? "New Operator";
                        var profile = new OperatorProfile(tenantId, sub, displayName);
                        
                        dbContext.OperatorProfiles.Add(profile);
                        await dbContext.SaveChangesAsync(context.RequestAborted);
                    }

                    cache.Set(cacheKey, true, CacheDuration);
                }
            }
        }

        await _next(context);
    }
}

public static class OperatorProvisioningMiddlewareExtensions
{
    public static IApplicationBuilder UseOperatorProvisioning(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<OperatorProvisioningMiddleware>();
    }
}
