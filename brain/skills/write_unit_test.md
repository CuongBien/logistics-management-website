# Skill: Write Unit Test (xUnit)

**Trigger:** Use this skill when asked to add tests, TDD, or verify logic.

## Tech Stack

- **Framework:** xUnit
- **Assertion:** FluentAssertions (dễ đọc hơn Assert gốc).
- **Mocking:** NSubstitute (cú pháp gọn hơn Moq).

## Standard Pattern: AAA

1.  **Arrange:** Chuẩn bị dữ liệu giả, mock dependencies.
2.  **Act:** Gọi hàm cần test.
3.  **Assert:** Kiểm tra kết quả trả về + Check các hàm Mock có được gọi đúng số lần không.

## Naming Convention

`MethodName_Scenario_ExpectedResult`
Ví dụ: `CreateOrder_WhenInventoryEmpty_ShouldReturnFailure`

## Example

```csharp
[Fact]
public async Task Handle_WhenInventoryEmpty_ShouldReturnFailure()
{
    // Arrange
    var command = new CreateOrderCommand(...);
    _inventoryServiceMock.CheckStock(Arg.Any<string>()).Returns(false);

    // Act
    var result = await _handler.Handle(command, CancellationToken.None);

    // Assert
    result.IsSuccess.Should().BeFalse();
    result.Error.Should().Be(DomainErrors.Order.OutOfStock);
}
```
