namespace Logistics.Domain.Enums
{
    public enum PaymentMethod
    {
        SenderPays = 0,    // Người gửi trả phí ship
        ReceiverPays = 1,  // Người nhận trả phí ship
        MonthlyDebt = 2    // Công nợ cuối tháng thanh toán sau
    }
}
