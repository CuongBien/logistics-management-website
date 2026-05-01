using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Ordering.Application.Common.Interfaces;
using System.Security.Claims;

namespace Ordering.Api.Infrastructure;

public sealed class HttpOrderTransitionContext : IOrderTransitionContext
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ILogger<HttpOrderTransitionContext> _logger;

    public HttpOrderTransitionContext(IHttpContextAccessor httpContextAccessor, ILogger<HttpOrderTransitionContext> logger)
    {
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
    }

    public string? OperatorId
    {
        get
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var operatorId =
                user?.FindFirst("sub")?.Value
                ?? user?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? user?.FindFirst("nameidentifier")?.Value;

            if (string.IsNullOrWhiteSpace(operatorId))
            {
                _logger.LogDebug("HttpOrderTransitionContext: no usable operator claim (sub/nameidentifier) on current user.");
                return null;
            }

            return operatorId;
        }
    }

    public string? CorrelationId
    {
        get
        {
            var http = _httpContextAccessor.HttpContext;
            if (http is null)
            {
                _logger.LogDebug("HttpOrderTransitionContext: no HttpContext for correlation id.");
                return null;
            }

            if (http.Request.Headers.TryGetValue("X-Correlation-Id", out var values))
            {
                var raw = values.FirstOrDefault();
                if (!string.IsNullOrWhiteSpace(raw))
                {
                    return raw;
                }
            }

            return null;
        }
    }
}
