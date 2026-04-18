public class InboundReceiptsController : ApiControllerBase 
{
    private readonly IMediator _mediator;
    public InboundReceiptsController(IMediator mediator)
    {
        _mediator = mediator;
    }
    [HttpPost]
    public async Task<IActionResult> CreateInboundReceipt([FromBody] CreateInboundReceiptCommand command)
    {
        var result = await _mediator.Send(command);
        if (result.IsSuccess)
        {
            return Ok(result.Value); // Return created ReceiptId
        }
        return BadRequest(result.Error); // Return error message
    }
    [HttpPut("{id}/receive")]
    public async Task<IActionResult> ReceiveInboundItem(Guid id, [FromBody] ReceiveInboundItemRequest request)
    {
        var command = new Warehouse.Application.Features.Inbound.Commands.ReceiveInboundItem.ReceiveInboundItemCommand(
            id,
            request.OrderId,
            request.BinCode,
            request.ScannedBy
        );

        await _mediator.Send(command);

        return NoContent();
    }
}