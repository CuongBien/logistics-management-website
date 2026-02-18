using BuildingBlocks.Domain;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace WMS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public abstract class ApiControllerBase : ControllerBase
{
    private ISender _mediator = null!;

    protected ISender Mediator => _mediator ??= HttpContext.RequestServices.GetRequiredService<ISender>();

    protected ActionResult<T> ToActionResult<T>(Result<T> result)
    {
        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }

        return HandleError(result.Error);
    }

    protected ActionResult ToActionResult(Result result)
    {
        if (result.IsSuccess)
        {
            return Ok();
        }

        return HandleError(result.Error);
    }

    private ActionResult HandleError(Error error)
    {
        var response = new { error.Code, error.Message };

        return error.Code switch
        {
            var code when code.Contains("NotFound") => NotFound(response),
            var code when code.Contains("Unauthorized") => Unauthorized(response),
            var code when code.Contains("Forbidden") => Forbid(),
            _ => BadRequest(response)
        };
    }
}
