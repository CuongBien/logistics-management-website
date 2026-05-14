using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Api.Controllers;
using Warehouse.Api.Controllers.Requests;
using Warehouse.Application.Features.Inbound.Commands.CreateReceipt;
using Warehouse.Application.Features.Inbound.Commands.ReceiveInboundItem;
using Warehouse.Application.Features.Outbound.Commands.CreateOutboundOrder;
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

        var warehouseId = Guid.NewGuid();
        var result = await controller.CreateReceipt(new CreateInboundReceiptCommand(Guid.NewGuid(), "tenant", "customer", warehouseId, "ASN-1"));

        Assert.IsType<BadRequestObjectResult>(result.Result);
        senderMock.Verify(x => x.Send(It.IsAny<CreateInboundReceiptCommand>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CreateOutboundOrder_ReturnsBadRequest_WhenClaimsMissing()
    {
        var senderMock = new Mock<ISender>(MockBehavior.Strict);
        var controller = BuildOutboundController(senderMock.Object, Array.Empty<Claim>());

        var result = await controller.CreateOutboundOrder(new CreateOutboundOrderRequest
        {
            OrderId = Guid.NewGuid(),
            DestinationWarehouseId = Guid.NewGuid(),
            Lines = new List<CreateOutboundOrderLineRequest>
            {
                new() { SkuCode = "SKU-1", RequestedQty = 1 }
            }
        });

        Assert.IsType<BadRequestObjectResult>(result.Result);
        senderMock.Verify(x => x.Send(It.IsAny<CreateOutboundOrderCommand>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CreateOutboundOrder_OverridesTenantAndCustomerFromClaims()
    {
        var senderMock = new Mock<ISender>();
        senderMock
            .Setup(x => x.Send(It.IsAny<CreateOutboundOrderCommand>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Logistics.Core.Result<Guid>.Success(Guid.NewGuid()));
        var claims = new[]
        {
            new Claim("tenant_id", "tenant-out"),
            new Claim("sub", "operator-out")
        };
        var controller = BuildOutboundController(senderMock.Object, claims);

        var orderId = Guid.NewGuid();
        var warehouseId = Guid.NewGuid();
        await controller.CreateOutboundOrder(new CreateOutboundOrderRequest
        {
            OrderId = orderId,
            DestinationWarehouseId = warehouseId,
            Lines = new List<CreateOutboundOrderLineRequest>
            {
                new() { SkuCode = "SKU-RED", RequestedQty = 2, Uom = "EA" }
            }
        });

        senderMock.Verify(
            x => x.Send(
                It.Is<CreateOutboundOrderCommand>(c =>
                    c.TenantId == "tenant-out"
                    && c.CustomerId == "operator-out"
                    && c.OrderId == orderId
                    && c.DestinationWarehouseId == warehouseId
                    && c.Lines.Count == 1
                    && c.Lines[0].SkuCode == "SKU-RED"
                    && c.Lines[0].RequestedQty == 2),
                It.IsAny<CancellationToken>()),
            Times.Once);
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
                It.Is<ReceiveInboundItemCommand>(c => c.TenantId == "tenant-9" && c.ScannedBy == "operator-9"),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    private static InboundController BuildInboundController(ISender sender, IReadOnlyCollection<Claim> claims)
    {
        var db = new Mock<IApplicationDbContext>();
        var services = new ServiceCollection();
        services.AddSingleton(sender);
        services.AddSingleton(db.Object);
        var httpContext = new DefaultHttpContext
        {
            RequestServices = services.BuildServiceProvider(),
            User = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"))
        };

        return new InboundController(db.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = httpContext }
        };
    }

    private static OutboundController BuildOutboundController(ISender sender, IReadOnlyCollection<Claim> claims)
    {
        var db = new Mock<IApplicationDbContext>();
        var services = new ServiceCollection();
        services.AddSingleton(sender);
        services.AddSingleton(db.Object);
        var httpContext = new DefaultHttpContext
        {
            RequestServices = services.BuildServiceProvider(),
            User = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"))
        };

        return new OutboundController(db.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = httpContext }
        };
    }
}
