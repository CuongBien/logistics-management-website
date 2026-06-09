using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Logistics.Core;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using Warehouse.Api.Controllers;
using Warehouse.Application.Features.Inventory.Commands.CreateSku;
using Xunit;

namespace Warehouse.Api.Tests;

public class InventoryControllerTests
{
    [Fact]
    public async Task CreateSku_UsesTenantClaimToPopulateTenantId()
    {
        var mediatorMock = new Mock<IMediator>();
        mediatorMock
            .Setup(x => x.Send(It.IsAny<CreateSkuCommand>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result<Guid>.Success(Guid.NewGuid()));

        var claims = new[]
        {
            new Claim("tenant_id", "tenant-a")
        };
        var controller = BuildController(mediatorMock.Object, claims);

        await controller.CreateSku(new CreateSkuCommand("SKU-RED-TSHIRT", "Red T-Shirt", "PCS", "active"));

        mediatorMock.Verify(
            x => x.Send(
                It.Is<CreateSkuCommand>(c =>
                    c.TenantId == "tenant-a" &&
                    c.SkuCode == "SKU-RED-TSHIRT"),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    private static InventoryController BuildController(IMediator mediator, IReadOnlyCollection<Claim> claims)
    {
        var services = new ServiceCollection();
        services.AddSingleton(mediator);

        var httpContext = new DefaultHttpContext
        {
            RequestServices = services.BuildServiceProvider(),
            User = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"))
        };

        return new InventoryController(mediator)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = httpContext
            }
        };
    }
}
