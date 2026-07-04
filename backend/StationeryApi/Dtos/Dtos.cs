namespace StationeryApi.Dtos;

public record LoginRequest(string Email);

public record UserDto(int Id, string FullName, string Email, string Role,
    int CompanyId, string CompanyName, int? DepartmentId, string? DepartmentName);

public record CreateRequestItemDto(int ItemId, int Qty);
public record CreateRequestDto(List<CreateRequestItemDto> Items, string? Note);

public record ApproveDto(bool Approve, string? RejectReason);
public record PrepareDto(DateTime PickupDate, string PickupTime, string PickupLocation);

public record ReceiveStockDto(int ItemId, int Qty, string? Reference, string? Note);
public record StockAdjustDto(int ItemId, int NewQty, string Note);
public record StockTransferDto(int ItemId, int Qty, string ToLocation, string? Note);

public record ReportFilter(DateTime? From, DateTime? To, int? CompanyId, int? DepartmentId);
