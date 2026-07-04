using System.ComponentModel.DataAnnotations;

namespace StationeryApi.Models;

public class Company
{
    public int Id { get; set; }
    [Required, MaxLength(120)] public string Name { get; set; } = "";
    [MaxLength(60)] public string Code { get; set; } = "";
    public List<Department> Departments { get; set; } = new();
    public List<User> Users { get; set; } = new();
}

public class Department
{
    public int Id { get; set; }
    [Required, MaxLength(120)] public string Name { get; set; } = "";
    public int CompanyId { get; set; }
    public Company? Company { get; set; }
    public int? ManagerUserId { get; set; }
    public User? Manager { get; set; }
    public List<User> Users { get; set; } = new();
}

public class User
{
    public int Id { get; set; }
    [Required, MaxLength(120)] public string FullName { get; set; } = "";
    [Required, MaxLength(160)] public string Email { get; set; } = "";
    public UserRole Role { get; set; } = UserRole.Employee;
    public int CompanyId { get; set; }
    public Company? Company { get; set; }
    public int? DepartmentId { get; set; }
    public Department? Department { get; set; }
    public bool IsActive { get; set; } = true;
}

public class Category
{
    public int Id { get; set; }
    [Required, MaxLength(80)] public string Name { get; set; } = "";
    [MaxLength(80)] public string NameEn { get; set; } = "";
    public List<Item> Items { get; set; } = new();
}

public class Item
{
    public int Id { get; set; }
    [Required, MaxLength(40)] public string Sku { get; set; } = "";
    [Required, MaxLength(160)] public string Name { get; set; } = "";
    [MaxLength(160)] public string NameEn { get; set; } = "";
    [MaxLength(30)] public string Unit { get; set; } = "ชิ้น";
    public decimal UnitPrice { get; set; }
    public int CategoryId { get; set; }
    public Category? Category { get; set; }
    public int StockQty { get; set; }
    public int ReorderLevel { get; set; } = 20;
    public bool IsActive { get; set; } = true;
}

public class Request
{
    public int Id { get; set; }
    [MaxLength(30)] public string RequestNo { get; set; } = "";
    public int RequesterUserId { get; set; }
    public User? Requester { get; set; }
    public int DepartmentId { get; set; }
    public Department? Department { get; set; }
    public int CompanyId { get; set; }
    public Company? Company { get; set; }
    public RequestStatus Status { get; set; } = RequestStatus.PendingApproval;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ApprovedAt { get; set; }
    public int? ApproverUserId { get; set; }
    public User? Approver { get; set; }
    public string? RejectReason { get; set; }
    public DateTime? PickupDate { get; set; }
    [MaxLength(80)] public string? PickupTime { get; set; }
    [MaxLength(160)] public string? PickupLocation { get; set; }
    public string? Note { get; set; }
    public decimal TotalAmount { get; set; }
    public List<RequestItem> Items { get; set; } = new();
}

public class RequestItem
{
    public int Id { get; set; }
    public int RequestId { get; set; }
    public Request? Request { get; set; }
    public int ItemId { get; set; }
    public Item? Item { get; set; }
    public int Qty { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Amount => Qty * UnitPrice;
}

public class StockMovement
{
    public int Id { get; set; }
    public int ItemId { get; set; }
    public Item? Item { get; set; }
    public StockMovementType Type { get; set; }
    public int Qty { get; set; }
    public DateTime OccurredAt { get; set; } = DateTime.UtcNow;
    [MaxLength(200)] public string? Reference { get; set; }
    [MaxLength(300)] public string? Note { get; set; }
    public int? UserId { get; set; }
    public User? User { get; set; }
}

public class Notification
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User? User { get; set; }
    [MaxLength(200)] public string Title { get; set; } = "";
    [MaxLength(1000)] public string Message { get; set; } = "";
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    [MaxLength(80)] public string? LinkPath { get; set; }
}

public class ApprovalWorkflow
{
    public int Id { get; set; }
    [Required, MaxLength(120)] public string Name { get; set; } = "";
    public int? CompanyId { get; set; }
    public decimal AmountThreshold { get; set; }
    [MaxLength(200)] public string Description { get; set; } = "";
    public bool IsActive { get; set; } = true;
}

public class SystemSetting
{
    public int Id { get; set; }
    [Required, MaxLength(80)] public string Key { get; set; } = "";
    [MaxLength(400)] public string Value { get; set; } = "";
    [MaxLength(200)] public string Description { get; set; } = "";
}
