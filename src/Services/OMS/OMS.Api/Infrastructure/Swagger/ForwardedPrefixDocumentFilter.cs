using Microsoft.AspNetCore.Http;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace OMS.Api.Infrastructure.Swagger; // Đổi namespace tương ứng cho WMS

/// <summary>
/// Sets Swagger server URL from X-Forwarded-Prefix header (injected by YARP gateway).
/// Falls back to "SwaggerOptions:ServerBasePath" in appsettings when header is absent
/// (e.g. direct access, Swashbuckle cache warmup, health checks).
/// Services remain decoupled from gateway topology — base path is infrastructure config,
/// not application code.
/// </summary>
public sealed class ForwardedPrefixDocumentFilter : IDocumentFilter
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IConfiguration _configuration;

    public ForwardedPrefixDocumentFilter(
        IHttpContextAccessor httpContextAccessor,
        IConfiguration configuration)
    {
        _httpContextAccessor = httpContextAccessor;
        _configuration = configuration;
    }

    public void Apply(OpenApiDocument swaggerDoc, DocumentFilterContext context)
    {
        // Priority 1: header injected by gateway at runtime
        var prefix = _httpContextAccessor.HttpContext?
            .Request.Headers["X-Forwarded-Prefix"]
            .FirstOrDefault();

        // Priority 2: fallback from appsettings / environment variable
        if (string.IsNullOrWhiteSpace(prefix))
            prefix = _configuration["SwaggerOptions:ServerBasePath"];

        if (!string.IsNullOrWhiteSpace(prefix))
        {
            swaggerDoc.Servers = new List<OpenApiServer>
            {
                new() { Url = prefix }
            };
        }
    }
}