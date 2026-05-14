using Microsoft.EntityFrameworkCore;
using Testcontainers.PostgreSql;
using Warehouse.Infrastructure.Persistence;
using Xunit;

namespace Warehouse.Api.Tests.Inbound.Postgres;

public sealed class InboundPostgresFixture : IAsyncLifetime
{
    private readonly PostgreSqlContainer _container = new PostgreSqlBuilder()
        .WithImage("postgres:16-alpine")
        .WithDatabase("wms_test")
        .WithUsername("postgres")
        .WithPassword("postgres")
        .Build();

    public string ConnectionString => _container.GetConnectionString();

    public async Task InitializeAsync()
    {
        await _container.StartAsync();

        // NOTE: Migrations in this repo currently fail deterministically in a clean container
        // with "relation already exists" during startup. For integration tests we only need
        // a real Postgres engine with relational constraints + indexes, so we use EnsureCreated.
        await using var ctx = CreateDbContext();
        await ctx.Database.EnsureDeletedAsync();
        await ctx.Database.EnsureCreatedAsync();
    }

    public async Task DisposeAsync()
    {
        await _container.DisposeAsync();
    }

    public WMSDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<WMSDbContext>()
            .UseNpgsql(ConnectionString)
            .EnableSensitiveDataLogging()
            .Options;

        return new WMSDbContext(options);
    }

    // (ResetSchemaAsync removed — EnsureDeleted/EnsureCreated is sufficient here.)
}

