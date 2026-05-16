using MasterData.Application.Features.Partners.Commands.CreatePartner;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace MasterData.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PartnersController : ControllerBase
{
    private readonly IMediator _mediator;

    public PartnersController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePartnerCommand command)
    {
        var result = await _mediator.Send(command);
        if (result.IsSuccess)
            return Ok(result.Value);
            
        return BadRequest(result.Error);
    }
}
