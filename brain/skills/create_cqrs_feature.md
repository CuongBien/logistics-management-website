# Skill: Create CQRS Feature (.NET 8 Standard)
**Description:** Standard Operating Procedure (SOP) for scaffolding a new feature using the CQRS pattern (Command Query Responsibility Segregation) with MediatR, FluentValidation, and MassTransit.

**Trigger:** Use this skill when the user asks to "Create API...", "Implement feature...", or "Add Command/Query".

## 1. Folder Structure Strategy (Vertical Slice)
Do not group by technical concerns (controllers/handlers). Group by **Feature**.
Target Path: `src/Core/Application/Features/[ModuleName]/[Commands|Queries]/[FeatureName]/`

**Example:**
- `src/Core/Application/Features/Orders/Commands/CreateOrder/`
  - `CreateOrderCommand.cs` (The Contract)
  - `CreateOrderValidator.cs` (The Rules)
  - `CreateOrderHandler.cs` (The Logic)

## 2. Implementation Rules

### Rule 1: The Contract (Command/Query)
- Must be a `public sealed record`.
- Must implement `IRequest<Result<TResponse>>`.
- Use a `DTO` record for complex response data.

**Result Pattern:** Never throw exceptions for business logic errors. Use `Result<T>` wrapper:

```csharp
// Shared kernel - Application/Common/Models/Result.cs
public class Result<T>
{
    public bool IsSuccess { get; private init; }
    public T Value { get; private init; }
    public Error Error { get; private init; }
    
    private Result() { }
    
    public static Result<T> Success(T value) => 
        new() { IsSuccess = true, Value = value };
    
    public static Result<T> Failure(Error error) => 
        new() { IsSuccess = false, Error = error };
}

public record Error(string Code, string Message)
{
    public static Error None => new(string.Empty, string.Empty);
    public static Error NullValue => new("Error.NullValue", "Value cannot be null");
}

// Domain errors - Domain/Errors/DomainErrors.cs
public static class DomainErrors
{
    public static class Order
    {
        public static Error NotFound => new("Order.NotFound", "Order not found");
        public static Error OutOfStock => new("Order.OutOfStock", "Insufficient inventory");
        public static Error InvalidCustomer => new("Order.InvalidCustomer", "Customer not found");
        public static Error CannotCancel => new("Order.CannotCancel", "Order cannot be cancelled at this stage");
    }
    
    public static class Inventory
    {
        public static Error InsufficientStock => new("Inventory.InsufficientStock", "Not enough stock available");
        public static Error InvalidWarehouse => new("Inventory.InvalidWarehouse", "Warehouse not found");
    }
}
```

### Rule 2: Validation (FluentValidation)
- Must inherit from `AbstractValidator<TCommand>`.
- **Constraint:** NEVER throw exceptions for validation errors.
- Use `.WithMessage("ErrorCode: Human readable message")`.

```csharp
public class CreateOrderValidator : AbstractValidator<CreateOrderCommand>
{
    public CreateOrderValidator()
    {
        RuleFor(v => v.CustomerId)
            .NotEmpty().WithMessage("CustomerId is required.");

        RuleFor(v => v.Items)
            .NotEmpty().WithMessage("Order must have at least one item.")
            .ForEach(item =>
            {
                item.ChildRules(i =>
                {
                    i.RuleFor(x => x.Quantity)
                        .GreaterThan(0).WithMessage("Quantity must be positive.");
                });
            });
    }
}
```

### Rule 3: The Handler (Business Logic)
- Must be `internal sealed class`.
- **Dependency Injection:** Use **Primary Constructors** (C# 12).
- **Database:** Inject `IApplicationDbContext` (not raw DbContext).
- **Messaging:** Inject `IPublishEndpoint` (MassTransit) if an event needs to be published.
- **Logging:** Use `ILogger<Handler>`.
- **Flow:**
  1. Validate business rules (beyond FluentValidation)
  2. Execute domain logic / Create or Update Entity
  3. Save changes to Database
  4. Domain Events are automatically dispatched after SaveChanges (via DbContext interceptor)
  5. Return `Result.Success` or `Result.Failure`

### Rule 4: The Controller (Endpoint)
- Inherit from `ApiControllerBase`.
- Use `[HttpPost]`, `[HttpGet]`, etc.
- Return `Task<ActionResult<Result<T>>>` or `Task<ActionResult>`.
- Use base `ToActionResult()` helper to map Result to HTTP status codes.

```csharp
// Base controller helper
protected ActionResult<Result<T>> ToActionResult<T>(Result<T> result)
{
    if (result.IsSuccess)
        return Ok(result);

    return result.Error.Code switch
    {
        var code when code.Contains("NotFound") => NotFound(result),
        var code when code.Contains("Unauthorized") => Unauthorized(result),
        var code when code.Contains("Forbidden") => Forbid(),
        _ => BadRequest(result)
    };
}
```

---

## 3. Template Code (Zero-Shot Generation)

When generating code, adapt this template. Replace placeholders like `[Entity]`, `[Feature]` with actual context.

### A. Command File (`Create[Entity]Command.cs`)

```csharp
using Application.Common.Security; // For [Authorize] if needed

namespace Application.Features.[Module].Commands.Create[Entity];

[Authorize(Policy = "CanCreate[Entity]")]
public sealed record Create[Entity]Command(
    string Name,
    decimal Value,
    Guid RelatedId
) : IRequest<Result<Guid>>;

public class Create[Entity]Validator : AbstractValidator<Create[Entity]Command>
{
    public Create[Entity]Validator()
    {
        RuleFor(v => v.Name)
            .NotEmpty().WithMessage("Name is required.")
            .MaximumLength(200).WithMessage("Name must not exceed 200 characters.");

        RuleFor(v => v.Value)
            .GreaterThan(0).WithMessage("Value must be positive.");
            
        RuleFor(v => v.RelatedId)
            .NotEmpty().WithMessage("RelatedId is required.");
    }
}
```

### B. Handler File (`Create[Entity]Handler.cs`)

```csharp
using Domain.Events; // Use Domain Events
using Domain.Errors;

namespace Application.Features.[Module].Commands.Create[Entity];

internal sealed class Create[Entity]Handler(
    IApplicationDbContext context,
    ILogger<Create[Entity]Handler> logger
    ) : IRequestHandler<Create[Entity]Command, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(
        Create[Entity]Command request, 
        CancellationToken cancellationToken)
    {
        logger.LogInformation("Creating new [Entity]: {Name}", request.Name);

        // 1. Business Rule Validation (beyond FluentValidation)
        var relatedEntity = await context.RelatedEntities
            .FindAsync([request.RelatedId], cancellationToken);
        
        if (relatedEntity == null)
            return Result<Guid>.Failure(DomainErrors.[Entity].RelatedNotFound);

        // 2. Create Domain Entity (Domain Events are raised here)
        var entity = Domain.Entities.[Entity].Create(
            request.Name,
            request.Value,
            request.RelatedId
        );

        // 3. Add to DB
        context.[Entities].Add(entity);
        await context.SaveChangesAsync(cancellationToken);
        
        // Note: Domain Events are automatically dispatched after SaveChanges
        // via DbContext.SaveChangesAsync override

        logger.LogInformation("[Entity] {Id} created successfully.", entity.Id);

        // 4. Return Result
        return Result<Guid>.Success(entity.Id);
    }
}
```

### C. Controller Endpoint

```csharp
namespace WebApi.Controllers;

[Route("api/[controller]")]
public class [Module]Controller : ApiControllerBase
{
    /// <summary>
    /// Creates a new [Entity]
    /// </summary>
    /// <param name="command">The creation request</param>
    /// <returns>The ID of the created entity</returns>
    /// <response code="200">Returns the created entity ID</response>
    /// <response code="400">If the request is invalid</response>
    [HttpPost]
    [ProducesResponseType(typeof(Result<Guid>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result<Guid>), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<Result<Guid>>> Create(Create[Entity]Command command)
    {
        var result = await Mediator.Send(command);
        return ToActionResult(result);
    }
}
```

## 4. Integration with Domain Events

**Important:** Domain Events are raised from Domain Layer but dispatched after SaveChanges.

### Domain Entity Example

```csharp
namespace Domain.Entities;

public class Order : AggregateRoot
{
    public Guid Id { get; private set; }
    public string CustomerId { get; private set; }
    public OrderStatus Status { get; private set; }
    public List<OrderItem> Items { get; private set; } = new();
    
    private Order() { } // EF Core
    
    public static Order Create(string customerId, List<OrderItem> items)
    {
        var order = new Order
        {
            Id = Guid.NewGuid(),
            CustomerId = customerId,
            Items = items,
            Status = OrderStatus.New
        };
        
        // Raise domain event
        order.RaiseDomainEvent(new OrderCreatedDomainEvent(
            order.Id,
            customerId,
            order.TotalAmount
        ));
        
        return order;
    }
    
    public Result Cancel()
    {
        if (Status != OrderStatus.New && Status != OrderStatus.Confirmed)
            return Result.Failure(DomainErrors.Order.CannotCancel);
            
        Status = OrderStatus.Cancelled;
        
        RaiseDomainEvent(new OrderCancelledDomainEvent(Id));
        
        return Result.Success();
    }
}
```

### DbContext Interceptor (Auto-dispatch events)

```csharp
namespace Infrastructure.Persistence;

public class ApplicationDbContext : DbContext, IApplicationDbContext
{
    private readonly IPublisher _publisher; // MediatR

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        // 1. Save changes first (transaction)
        var result = await base.SaveChangesAsync(cancellationToken);

        // 2. Dispatch domain events after successful save
        await DispatchDomainEventsAsync(cancellationToken);

        return result;
    }

    private async Task DispatchDomainEventsAsync(CancellationToken cancellationToken)
    {
        var entities = ChangeTracker.Entries<AggregateRoot>()
            .Where(e => e.Entity.DomainEvents.Any())
            .Select(e => e.Entity)
            .ToList();

        var domainEvents = entities
            .SelectMany(e => e.DomainEvents)
            .ToList();

        entities.ForEach(e => e.ClearDomainEvents());

        foreach (var domainEvent in domainEvents)
        {
            await _publisher.Publish(domainEvent, cancellationToken);
        }
    }
}
```

## 5. Testing Strategy

### Unit Test: Handler

```csharp
public class Create[Entity]HandlerTests
{
    private readonly IApplicationDbContext _context;
    private readonly ILogger<Create[Entity]Handler> _logger;
    private readonly Create[Entity]Handler _handler;

    public Create[Entity]HandlerTests()
    {
        _context = Substitute.For<IApplicationDbContext>();
        _logger = Substitute.For<ILogger<Create[Entity]Handler>>();
        _handler = new Create[Entity]Handler(_context, _logger);
    }

    [Fact]
    public async Task Handle_WhenValid_ShouldReturnSuccess()
    {
        // Arrange
        var command = new Create[Entity]Command("Test", 100m, Guid.NewGuid());
        
        _context.[Entities].Returns(new FakeDbSet<[Entity]>());
        _context.SaveChangesAsync(Arg.Any<CancellationToken>()).Returns(1);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeEmpty();
        
        await _context.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_WhenRelatedNotFound_ShouldReturnFailure()
    {
        // Arrange
        var command = new Create[Entity]Command("Test", 100m, Guid.NewGuid());
        
        _context.RelatedEntities.FindAsync(Arg.Any<object[]>(), Arg.Any<CancellationToken>())
            .Returns((RelatedEntity)null);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Code.Should().Be(DomainErrors.[Entity].RelatedNotFound.Code);
    }
}
```

## 6. Common Patterns

### Query Example (Read Operations)

```csharp
// Query
public sealed record Get[Entity]ByIdQuery(Guid Id) : IRequest<Result<[Entity]Dto>>;

// Handler
internal sealed class Get[Entity]ByIdHandler(
    IApplicationDbContext context
) : IRequestHandler<Get[Entity]ByIdQuery, Result<[Entity]Dto>>
{
    public async Task<Result<[Entity]Dto>> Handle(
        Get[Entity]ByIdQuery request, 
        CancellationToken cancellationToken)
    {
        var entity = await context.[Entities]
            .AsNoTracking() // Important for read-only queries
            .Where(e => e.Id == request.Id)
            .Select(e => new [Entity]Dto(
                e.Id,
                e.Name,
                e.Value
            ))
            .FirstOrDefaultAsync(cancellationToken);

        return entity == null
            ? Result<[Entity]Dto>.Failure(DomainErrors.[Entity].NotFound)
            : Result<[Entity]Dto>.Success(entity);
    }
}
```

### Pagination Example

```csharp
public sealed record Get[Entities]Query(
    int PageNumber = 1,
    int PageSize = 10,
    string? SearchTerm = null
) : IRequest<Result<PaginatedList<[Entity]Dto>>>;
```

## Best Practices Checklist

- [ ] Command/Query is `sealed record`
- [ ] Handler is `internal sealed class` with primary constructor
- [ ] Validation uses FluentValidation (not manual if-checks)
- [ ] Business errors return `Result.Failure`, not throw exceptions
- [ ] Domain Events raised from Domain Layer
- [ ] Queries use `AsNoTracking()` for read-only operations
- [ ] Handlers have single responsibility (one feature per handler)
- [ ] Unit tests cover happy path and error cases
- [ ] XML comments on controller actions for Swagger