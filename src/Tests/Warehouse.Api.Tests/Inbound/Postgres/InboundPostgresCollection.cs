namespace Warehouse.Api.Tests.Inbound.Postgres;

using Xunit;

[CollectionDefinition(Name)]
public sealed class InboundPostgresCollection : ICollectionFixture<InboundPostgresFixture>
{
    public const string Name = "InboundPostgres";
}

