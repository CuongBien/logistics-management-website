public class CreateInboundReceiptCommandHandler : IRequestHandler<CreateInboundReceiptCommand, Result<Guid>>
{
    private readonly IApplicationDbContext _dbContext;
    public CreateInboundReceiptCommandHandler(IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }
    public async Task<Result<Guid>> Handle(CreateInboundReceiptCommand request, CancellationToken cancellationToken)
    {
        // Create new InboundReceipt aggregate
        var receipt = new InboundReceipt
        {
            Id = Guid.NewGuid(),
            Status = InboundReceiptStatus.New,
            OrderIds = request.OrderIds
        };
        // Add to database context
        _dbContext.InboundReceipts.Add(receipt);
        // Save changes to database
        await _dbContext.SaveChangesAsync(cancellationToken);
        // Return created ReceiptId
        return Result.Success(receipt.Id);
    }
}