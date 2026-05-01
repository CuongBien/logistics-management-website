using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Ordering.Application.Common.Interfaces;

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
            var sub = user?.FindFirst("sub")?.Value;
            if (string.IsNullOrWhiteSpace(sub))
            {
                _logger.LogDebug("HttpOrderTransitionContext: no sub claim on current user.");
                return null;
            }

            return sub;
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
