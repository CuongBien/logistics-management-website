using System.Security.Claims;
using Logistics.Core;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using Warehouse.Api.Controllers;
using Warehouse.Application.Features.Inventory.Commands.CreateInventoryItem;
using Xunit;

namespace Warehouse.Api.Tests;

public class InventoryControllerTests
{
    [Fact]
    public async Task Create_ReturnsBadRequest_WhenTenantOrCustomerClaimMissing()
    {
        var senderMock = new Mock<ISender>(MockBehavior.Strict);
        var controller = BuildController(senderMock.Object, Array.Empty<Claim>());

        var result = await controller.Create(new CreateInventoryItemCommand("SKU-RED-TSHIRT", 10, null, null));

        Assert.IsType<BadRequestObjectResult>(result.Result);
        senderMock.Verify(
            x => x.Send(It.IsAny<CreateInventoryItemCommand>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task Create_UsesClaimsToPopulateTenantAndCustomer()
    {
        var senderMock = new Mock<ISender>();
        senderMock
            .Setup(x => x.Send(It.IsAny<CreateInventoryItemCommand>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result<Guid>.Success(Guid.NewGuid()));

        var claims = new[]
        {
            new Claim("tenant_id", "tenant-a"),
            new Claim("sub", "customer-a")
        };
        var controller = BuildController(senderMock.Object, claims);

        await controller.Create(new CreateInventoryItemCommand("SKU-RED-TSHIRT", 10, null, null));

        senderMock.Verify(
            x => x.Send(
                It.Is<CreateInventoryItemCommand>(c =>
                    c.TenantId == "tenant-a" &&
                    c.CustomerId == "customer-a" &&
                    c.Sku == "SKU-RED-TSHIRT"),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    private static InventoryController BuildController(ISender sender, IReadOnlyCollection<Claim> claims)
    {
        var services = new ServiceCollection();
        services.AddSingleton(sender);

        var httpContext = new DefaultHttpContext
        {
            RequestServices = services.BuildServiceProvider(),
            User = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"))
        };

        return new InventoryController
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = httpContext
            }
        };
    }
}
