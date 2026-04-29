using System.Net.Http.Json;
using Microsoft.Extensions.Options;

namespace Ordering.Infrastructure.ErpSync;

public class ErpMasterDataClient : IErpMasterDataClient
{
    private readonly HttpClient _httpClient;
    private readonly ErpSyncOptions _options;

    public ErpMasterDataClient(HttpClient httpClient, IOptions<ErpSyncOptions> options)
    {
        _httpClient = httpClient;
        _options = options.Value;
    }

    public async Task<ErpSyncPage<ErpSkuDto>> GetSkusAsync(
        string tenantId,
        string updatedAfterCursor,
        int batchSize,
        CancellationToken cancellationToken)
    {
        var requestUri = $"/skus?tenant_id={Uri.EscapeDataString(tenantId)}&updated_after={Uri.EscapeDataString(updatedAfterCursor)}&limit={batchSize}";
        using var request = BuildRequest(HttpMethod.Get, requestUri);
        using var response = await _httpClient.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException($"ERP SKU sync request failed with status {(int)response.StatusCode} for tenant {tenantId}.");
        }

        var payload = await response.Content.ReadFromJsonAsync<ErpSkuResponse>(cancellationToken: cancellationToken);
        if (payload is null)
        {
            throw new InvalidOperationException("ERP SKU sync response payload was empty.");
        }

        return new ErpSyncPage<ErpSkuDto>(payload.Items, payload.NextCursor);
    }

    public async Task<ErpSyncPage<ErpWarehouseDto>> GetWarehousesAsync(
        string tenantId,
        string updatedAfterCursor,
        int batchSize,
        CancellationToken cancellationToken)
    {
        var requestUri = $"/warehouses?tenant_id={Uri.EscapeDataString(tenantId)}&updated_after={Uri.EscapeDataString(updatedAfterCursor)}&limit={batchSize}";
        using var request = BuildRequest(HttpMethod.Get, requestUri);
        using var response = await _httpClient.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException($"ERP warehouse sync request failed with status {(int)response.StatusCode} for tenant {tenantId}.");
        }

        var payload = await response.Content.ReadFromJsonAsync<ErpWarehouseResponse>(cancellationToken: cancellationToken);
        if (payload is null)
        {
            throw new InvalidOperationException("ERP warehouse sync response payload was empty.");
        }

        return new ErpSyncPage<ErpWarehouseDto>(payload.Items, payload.NextCursor);
    }

    private HttpRequestMessage BuildRequest(HttpMethod method, string requestUri)
    {
        var request = new HttpRequestMessage(method, requestUri);
        request.Headers.Add("X-API-Key", _options.ApiKey);
        return request;
    }

    private record ErpSkuResponse(IReadOnlyCollection<ErpSkuDto> Items, string NextCursor);
    private record ErpWarehouseResponse(IReadOnlyCollection<ErpWarehouseDto> Items, string NextCursor);
}
