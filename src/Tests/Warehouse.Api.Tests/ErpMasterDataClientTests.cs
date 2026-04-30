using System.Net;
using System.Text;
using Microsoft.Extensions.Options;
using Warehouse.Infrastructure.ErpSync;
using Xunit;

namespace Warehouse.Api.Tests;

public class ErpMasterDataClientTests
{
    [Fact]
    public async Task GetSkusAsync_UsesApiBasePath_WhenBuildingRequestUri()
    {
        var handler = new CapturingHandler("""{"items":[],"nextCursor":"cursor-1"}""");
        var httpClient = new HttpClient(handler)
        {
            BaseAddress = new Uri("http://erp.local/api/")
        };
        var options = Options.Create(new ErpSyncOptions
        {
            ApiKey = "dev-key",
            BaseUrl = "http://erp.local/api",
            BatchSize = 100,
            SyncIntervalSeconds = 10,
            ShadowMode = true,
            EnforceWmsValidation = false,
            TenantIds = new[] { "default-tenant" }
        });

        var client = new ErpMasterDataClient(httpClient, options);
        await client.GetSkusAsync("default-tenant", "cursor-0", 100, CancellationToken.None);

        Assert.NotNull(handler.LastRequestUri);
        Assert.Equal("http://erp.local/api/skus?tenant_id=default-tenant&updated_after=cursor-0&limit=100", handler.LastRequestUri!.ToString());
    }

    private sealed class CapturingHandler(string json) : HttpMessageHandler
    {
        public Uri? LastRequestUri { get; private set; }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            LastRequestUri = request.RequestUri;
            var response = new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(json, Encoding.UTF8, "application/json")
            };
            return Task.FromResult(response);
        }
    }
}
