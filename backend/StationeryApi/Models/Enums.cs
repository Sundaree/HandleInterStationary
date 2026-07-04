namespace StationeryApi.Models;

public enum UserRole
{
    Employee = 1,
    DepartmentManager = 2,
    HR = 3,
    Admin = 4,
    Executive = 5
}

public enum RequestStatus
{
    Draft = 0,
    PendingApproval = 1,
    Approved = 2,
    Rejected = 3,
    Preparing = 4,
    ReadyForPickup = 5,
    Completed = 6,
    Cancelled = 7
}

public enum StockMovementType
{
    Receive = 1,
    Issue = 2,
    Adjustment = 3,
    Transfer = 4,
    Count = 5
}
