using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using Warehouse.Api.Controllers;
using Warehouse.Api.Controllers.Requests;
using Warehouse.Application.Features.Inbound.Commands.CreateReceipt;
using Warehouse.Application.Features.Inbound.Commands.ReceiveInboundItem;
using Warehouse.Application.Features.Outbound.Commands.SortOrder;
using Xunit;

namespace Warehouse.Api.Tests;

public class InboundOutboundControllerTests
{
    [Fact]
    public async Task CreateReceipt_ReturnsBadRequest_WhenClaimsMissing()
    {
        var senderMock = new Mock<ISender>(MockBehavior.Strict);
        var controller = BuildInboundController(senderMock.Object, Array.Empty<Claim>());

        var result = await controller.CreateReceipt(new CreateInboundReceiptCommand(Guid.NewGuid(), "tenant", "customer", "ASN-1"));

        Assert.IsType<BadRequestObjectResult>(result.Result);
        senderMock.Verify(x => x.Send(It.IsAny<CreateInboundReceiptCommand>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task SortOrder_OverridesTenantAndCustomerFromClaims()
    {
        var senderMock = new Mock<ISender>();
        senderMock
            .Setup(x => x.Send(It.IsAny<SortOrderCommand>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Logistics.Core.Result.Success());
        var claims = new[]
        {
            new Claim("tenant_id", "tenant-1"),
            new Claim("sub", "customer-1")
        };
        var controller = BuildOutboundController(senderMock.Object, claims);

        await controller.SortOrder(new SortOrderCommand(Guid.NewGuid(), Guid.NewGuid(), "wrong-tenant", "wrong-customer", null));

        senderMock.Verify(
            x => x.Send(
                It.Is<SortOrderCommand>(c => c.TenantId == "tenant-1" && c.CustomerId == "customer-1" && !string.IsNullOrWhiteSpace(c.SourceShipmentNo)),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Receive_UsesTenantFromClaims()
    {
        var senderMock = new Mock<ISender>();
        senderMock
            .Setup(x => x.Send(It.IsAny<ReceiveInboundItemCommand>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Logistics.Core.Result.Success());
        var claims = new[] { new Claim("tenant_id", "tenant-9") };
        var controller = BuildInboundController(senderMock.Object, claims);

        await controller.Receive(Guid.NewGuid(), new ReceiveInboundItemRequest
        {
            OrderId = Guid.NewGuid(),
            TenantId = "wrong",
            SkuCode = "SKU-RED-TSHIRT",
            BinCode = "BIN-01",
            ScannedBy = "operator-1"
        });

        senderMock.Verify(
            x => x.Send(
                It.Is<ReceiveInboundItemCommand>(c => c.TenantId == "tenant-9"),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    private static InboundController BuildInboundController(ISender sender, IReadOnlyCollection<Claim> claims)
    {
        var services = new ServiceCollection();
        services.AddSingleton(sender);
        var httpContext = new DefaultHttpContext
        {
            RequestServices = services.BuildServiceProvider(),
            User = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"))
        };

        return new InboundController
        {
            ControllerContext = new ControllerContext { HttpContext = httpContext }
        };
    }

    private static OutboundController BuildOutboundController(ISender sender, IReadOnlyCollection<Claim> claims)
    {
        var services = new ServiceCollection();
        services.AddSingleton(sender);
        var httpContext = new DefaultHttpContext
        {
            RequestServices = services.BuildServiceProvider(),
            User = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"))
        };

        return new OutboundController
        {
            ControllerContext = new ControllerContext { HttpContext = httpContext }
        };
    }
}
