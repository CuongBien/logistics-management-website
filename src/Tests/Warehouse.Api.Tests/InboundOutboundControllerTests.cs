using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using Warehouse.Api.Controllers;
using Warehouse.Api.Controllers.Requests;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Application.Features.Inbound.Commands.CreateReceipt;
using Warehouse.Application.Features.Inbound.Commands.ReceiveInboundItem;
using Warehouse.Application.Features.Outbound.Commands.SortOrder;
using Warehouse.Application.Features.Outbound.Commands.ShipAndReleaseBin;
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

        await controller.SortOrder(new SortOrderRequest
        {
            OrderId = Guid.NewGuid(),
            DestinationWarehouseId = Guid.NewGuid(),
            SourceShipmentNo = null
        });

        senderMock.Verify(
            x => x.Send(
                It.Is<SortOrderCommand>(c => c.TenantId == "tenant-1" && c.OperatorId == "customer-1" && !string.IsNullOrWhiteSpace(c.SourceShipmentNo)),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Receive_UsesTenantFromClaims()
    {
        var senderMock = new Mock<ISender>();
        senderMock
            .Setup(x => x.Send(It.IsAny<ReceiveInboundItemCommand>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Logistics.Core.Result<ReceiveInboundItemResponse>.Success(
                new ReceiveInboundItemResponse(false, null)));
        var claims = new[]
        {
            new Claim("tenant_id", "tenant-9"),
            new Claim("sub", "operator-9")
        };
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
                It.Is<ReceiveInboundItemCommand>(c => c.TenantId == "" && c.ScannedBy == "operator-9"),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ShipAndReleaseBin_DelegatesToCommand()
    {
        var senderMock = new Mock<ISender>();
        var orderId = Guid.NewGuid();
        var resultDto = new ShipAndReleaseBinResult(orderId, "ORD-123", "Shipped", new List<string> { "BIN-A" }, "Success");

        senderMock
            .Setup(x => x.Send(It.IsAny<ShipAndReleaseBinCommand>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Logistics.Core.Result<ShipAndReleaseBinResult>.Success(resultDto));

        var claims = new[]
        {
            new Claim("sub", "operator-1")
        };
        var controller = BuildOutboundController(senderMock.Object, claims);

        var response = await controller.ShipAndReleaseBin(new ShipAndReleaseBinRequest { OrderNo = "ORD-123" });

        var okResult = Assert.IsType<OkObjectResult>(response.Result);
        var returnedVal = Assert.IsType<ShipAndReleaseBinResult>(okResult.Value);
        Assert.Equal("ORD-123", returnedVal.OrderNo);
        Assert.Equal("Shipped", returnedVal.NewStatus);

        senderMock.Verify(
            x => x.Send(
                It.Is<ShipAndReleaseBinCommand>(c => c.OrderNo == "ORD-123" && c.OperatorId == "operator-1"),
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

        var contextMock = new Mock<IApplicationDbContext>();

        return new InboundController(contextMock.Object)
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

        var contextMock = new Mock<IApplicationDbContext>();

        return new OutboundController(contextMock.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = httpContext }
        };
    }
}
