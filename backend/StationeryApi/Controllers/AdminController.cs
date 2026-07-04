using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StationeryApi.Data;
using StationeryApi.Models;

namespace StationeryApi.Controllers;

[ApiController]
[Route("api/admin")]
public class AdminController : ControllerBase
{
    private readonly AppDbContext _db;
    public AdminController(AppDbContext db) => _db = db;

    // Users
    [HttpGet("users")]
    public async Task<IActionResult> Users() => Ok(await _db.Users
        .Include(u => u.Company).Include(u => u.Department)
        .OrderBy(u => u.FullName)
        .Select(u => new {
            u.Id, u.FullName, u.Email, Role = u.Role.ToString(), u.IsActive,
            Company = u.Company!.Name, Department = u.Department == null ? null : u.Department.Name
        }).ToListAsync());

    [HttpPost("users")]
    public async Task<IActionResult> CreateUser([FromBody] User u)
    {
        _db.Users.Add(u); await _db.SaveChangesAsync(); return Ok(u);
    }

    [HttpPut("users/{id:int}")]
    public async Task<IActionResult> UpdateUser(int id, [FromBody] User u)
    {
        var e = await _db.Users.FindAsync(id); if (e == null) return NotFound();
        e.FullName = u.FullName; e.Role = u.Role; e.CompanyId = u.CompanyId;
        e.DepartmentId = u.DepartmentId; e.IsActive = u.IsActive;
        await _db.SaveChangesAsync(); return Ok(e);
    }

    // Companies
    [HttpGet("companies")]
    public async Task<IActionResult> Companies() => Ok(await _db.Companies.OrderBy(c => c.Name).ToListAsync());
    [HttpPost("companies")] public async Task<IActionResult> AddCompany([FromBody] Company c)
    { _db.Companies.Add(c); await _db.SaveChangesAsync(); return Ok(c); }

    // Departments
    [HttpGet("departments")]
    public async Task<IActionResult> Departments() => Ok(await _db.Departments
        .Include(d => d.Company).Include(d => d.Manager)
        .OrderBy(d => d.Company!.Name).ThenBy(d => d.Name)
        .Select(d => new {
            d.Id, d.Name, Company = d.Company!.Name, d.CompanyId,
            Manager = d.Manager == null ? null : d.Manager.FullName
        }).ToListAsync());
    [HttpPost("departments")] public async Task<IActionResult> AddDept([FromBody] Department d)
    { _db.Departments.Add(d); await _db.SaveChangesAsync(); return Ok(d); }

    // Categories
    [HttpGet("categories")]
    public async Task<IActionResult> Categories() => Ok(await _db.Categories.OrderBy(c => c.Name).ToListAsync());
    [HttpPost("categories")] public async Task<IActionResult> AddCat([FromBody] Category c)
    { _db.Categories.Add(c); await _db.SaveChangesAsync(); return Ok(c); }

    // Items
    [HttpGet("items")]
    public async Task<IActionResult> Items() => Ok(await _db.Items.Include(i => i.Category)
        .OrderBy(i => i.Name)
        .Select(i => new {
            i.Id, i.Sku, i.Name, i.NameEn, i.Unit, i.UnitPrice, i.StockQty, i.ReorderLevel, i.IsActive,
            Category = i.Category!.Name, i.CategoryId
        }).ToListAsync());
    [HttpPost("items")] public async Task<IActionResult> AddItem([FromBody] Item i)
    { _db.Items.Add(i); await _db.SaveChangesAsync(); return Ok(i); }
    [HttpPut("items/{id:int}")]
    public async Task<IActionResult> UpdateItem(int id, [FromBody] Item i)
    {
        var e = await _db.Items.FindAsync(id); if (e == null) return NotFound();
        e.Sku = i.Sku; e.Name = i.Name; e.NameEn = i.NameEn; e.Unit = i.Unit;
        e.UnitPrice = i.UnitPrice; e.ReorderLevel = i.ReorderLevel; e.IsActive = i.IsActive;
        e.CategoryId = i.CategoryId;
        await _db.SaveChangesAsync(); return Ok(e);
    }

    // Approval workflows
    [HttpGet("workflows")]
    public async Task<IActionResult> Workflows() => Ok(await _db.ApprovalWorkflows.ToListAsync());
    [HttpPost("workflows")] public async Task<IActionResult> AddWf([FromBody] ApprovalWorkflow w)
    { _db.ApprovalWorkflows.Add(w); await _db.SaveChangesAsync(); return Ok(w); }

    // Notifications
    [HttpGet("notifications/{userId:int}")]
    public async Task<IActionResult> Notifications(int userId) =>
        Ok(await _db.Notifications.Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt).Take(50).ToListAsync());

    // Settings
    [HttpGet("settings")]
    public async Task<IActionResult> Settings() => Ok(await _db.SystemSettings.OrderBy(s => s.Key).ToListAsync());
    [HttpPut("settings/{id:int}")]
    public async Task<IActionResult> UpdateSetting(int id, [FromBody] SystemSetting s)
    {
        var e = await _db.SystemSettings.FindAsync(id); if (e == null) return NotFound();
        e.Value = s.Value; e.Description = s.Description;
        await _db.SaveChangesAsync(); return Ok(e);
    }
}
